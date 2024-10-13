"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.scss";
import { Book } from "@/app/types/Book";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/app/util/firebase/firestore/init";
import { redirect } from "next/navigation";
import { Loader } from "@/app/Components/Loader";
import { CommentConverter } from "@/app/util/firebase/firestore/Converters/Comments";
import { Comment } from "@/app/types/Comment";
import PDFViewer from "@/app/Components/PDFViewer";
import { motion } from "framer-motion";
import { BiSolidComment, BiX } from "react-icons/bi";

const CommentItem = ({}: Comment) => {
  return <div></div>;
};

interface SidebarProps {
  id: string;
  menuOpen: boolean;
  toggleMenuOpen: () => void;
  pageNumber: number;
  isCommenting: boolean;
  setIsCommenting: () => void;
}

const Sidebar = ({
  id,
  menuOpen,
  toggleMenuOpen,
  pageNumber,
  isCommenting,
  setIsCommenting,
}: SidebarProps) => {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const commentsQuery = query(
      collection(db, "comments").withConverter(CommentConverter),
      where("bookUid", "==", id)
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      setComments(snapshot.docs.map((doc) => doc.data()));
    });

    return () => unsubscribe();
  }, []);

  const sortedComments = useMemo(
    () => comments.toSorted((a, b) => a.likes - b.likes),
    [comments]
  );

  return (
    <motion.aside
      className={styles.sidebar}
      initial={{ width: 0 }}
      animate={{ width: menuOpen ? "45vw" : 0 }}
    >
      <button className={styles.menuButton} onClick={toggleMenuOpen}>
        {menuOpen ? (
          <BiX size={30} color="var(--dark)" />
        ) : (
          <BiSolidComment size={20} color="var(--dark)" />
        )}
      </button>
      <div className={styles.content}>
        <span className={styles.heading}>AI Breakdown</span>
        <div className={styles.aiBreakdown}>
          <div className={styles.placeholder}>
            There is no text right now...
          </div>
        </div>
        <span className={styles.heading}>Comments</span>
        {sortedComments.length === 0 ? (
          <div className={styles.placeholder}>
            There are no comments right now...
          </div>
        ) : (
          sortedComments.map(
            ({
              id,
              bookUid,
              content,
              pageNumber,
              likes,
              userUid,
              postedOn,
            }) => (
              <CommentItem
                key={id}
                id={id}
                bookUid={bookUid}
                content={content}
                pageNumber={pageNumber}
                likes={likes}
                userUid={userUid}
                postedOn={postedOn}
              />
            )
          )
        )}
      </div>
    </motion.aside>
  );
};

export default function Editor({ params: { id } }: { params: { id: string } }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [meta, setMeta] = useState<Book>();
  const [[width, height], setDimensions] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    if (width || height) return;

    setDimensions([600, window.innerHeight - 120]);
  }, []);

  useEffect(() => console.log([width, height]), [width, height]);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setLoading(true);

        const metaRef = query(collection(db, "books"), where("id", "==", id));
        const metaSnap = await getDocs(metaRef);
        if (metaSnap.empty) return;

        const meta = metaSnap.docs[0].data() as Book;
        
        setMeta(meta);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [id]);

  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  if (!loading && !meta) {
    redirect("/dashboard");
  }

  return (
    <div className={styles.layout}>
      {loading ? (
        <div className={styles.loading}>
          <span className={styles.big}>Hold on Tight!</span>
          <div className={styles.tag}>
            <Loader color="gray" />
            <span className={styles.small}>
              We&apos;re grabbing your book...
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.header}>{meta!.title}</div>
          <div className={styles.contentLayout}>
            <div className={styles.pdf}>
              <PDFViewer
                pdfId={id}
                width={width || 200}
                height={height || 200}
                openCommentary={() => {}}
                closeCommentary={() => {}}
              />
              <div className={styles.inputWrapper}>
                <motion.div
                  className={styles.input}
                  animate={{
                    opacity: menuOpen ? 1 : 0,
                    width: menuOpen ? 500 : 0,
                    height: menuOpen ? 80 : 0,
                    borderRadius: menuOpen ? 10 : 100,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: "hidden", border: "2px solid red" }}
                >
                  {/* <textarea
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 10,
                      padding: 5,
                      border: "none",
                      outline: "none",
                      boxShadow: "none",
                      resize: "none",
                    }}
                    placeholder={
                      isWritingNewMessage
                        ? "Contribute your thoughts"
                        : "Ask AI your question!"
                    }
                    onChange={(e) => setInputText(e.target.value)}
                    value={inputText}
                  /> */}
                </motion.div>
              </div>
            </div>
            <Sidebar
              id={id}
              menuOpen={menuOpen}
              toggleMenuOpen={() => setMenuOpen((prev) => !prev)}
              isCommenting={false}
              setIsCommenting={() => {}}
              pageNumber={0}
            />
          </div>
        </>
      )}
    </div>
  );
}
