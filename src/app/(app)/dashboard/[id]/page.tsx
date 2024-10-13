"use client";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.scss";
import { Book } from "@/app/types/Book";
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/app/util/firebase/firestore/init";
import { Loader } from "@/app/Components/Loader";
import { CommentConverter } from "@/app/util/firebase/firestore/Converters/Comments";
import { Comment } from "@/app/types/Comment";
import PDFViewer from "@/app/Components/PDFViewer";
import { motion } from "framer-motion";
import { BiRightArrowAlt, BiSolidComment, BiX } from "react-icons/bi";
import { textHandler } from "@/app/util/aws";
import { useAuth } from "@/app/context/Auth";
import {
  MathJaxContext as BetterMathJaxContext,
  MathJax as BetterMathJax,
} from "better-react-mathjax";
import { formatDistanceToNow } from 'date-fns';
import { FaThumbsUp } from 'react-icons/fa';

const MathJaxConfig = {
  loader: { load: ["input/tex", "output/svg"] },
  tex: {
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"],
    ],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"],
    ],
    processEscapes: true,
    processEnvironments: true,
  },
  svg: {
    fontCache: "global",
  },
};

const CommentItem = ({ id, content, likes, userUid, postedOn, pageNumber }: Comment) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes.length);

  useEffect(() => {
    if (user) {
      setIsLiked(likes.includes(user.uid));
    }
  }, [user, likes]);

  const handleLike = async () => {
    if (!user) return;

    const commentRef = doc(db, "comments", id);
    try {
      if (isLiked) {
        await updateDoc(commentRef, {
          likes: arrayRemove(user.uid)
        });
        setLikeCount(prev => prev - 1);
      } else {
        await updateDoc(commentRef, {
          likes: arrayUnion(user.uid)
        });
        setLikeCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleDelete = async () => {
    if (!user || user.uid !== userUid) return;

    try {
      await deleteDoc(doc(db, "comments", id));
      // The comment will be removed from the list automatically due to the onSnapshot listener
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  return (
    <div className={styles.commentItem}>
      <div className={styles.commentHeader}>
        <span className={styles.commentMeta}>
          {formatDistanceToNow(postedOn)} ago • Page {pageNumber}
        </span>
      </div>
      <div className={styles.commentContent}>{content}</div>
      <div className={styles.commentFooter}>
        <button 
          className={`${styles.likeButton} ${isLiked ? styles.liked : ''}`} 
          onClick={handleLike}
        >
          <FaThumbsUp /> {likeCount}
        </button>
        {user && user.uid === userUid && (
          <button className={styles.deleteButton} onClick={handleDelete}>Delete</button>
        )}
      </div>
    </div>
  );
};

interface SidebarProps {
  id: string;
  menuOpen: boolean;
  toggleMenuOpen: () => void;
  pageNumber: number;
  isCommenting: boolean;
  aiBreakdown: { preamble: string; content: string };
  comments: Comment[];
}

const Sidebar = ({
  id,
  menuOpen,
  toggleMenuOpen,
  pageNumber,
  aiBreakdown,
  comments,
}: SidebarProps) => {
  const sortedComments = useMemo(
    () => [...comments].sort((a, b) => b.likes.length - a.likes.length),
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
        <BetterMathJaxContext config={MathJaxConfig}>
          <div className={styles.aiBreakdown}>
            {aiBreakdown.content ? (
              <BetterMathJax className={styles.math} dynamic>
                {`${aiBreakdown.preamble}\n${aiBreakdown.content}`}
              </BetterMathJax>
            ) : (
              <span className={styles.placeholder}>
                There is no text right now...
              </span>
            )}
          </div>
        </BetterMathJaxContext>
        <span className={styles.heading}>Comments</span>
        {sortedComments.length === 0 ? (
          <div className={styles.placeholder}>
            There are no comments right now...
          </div>
        ) : (
          sortedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              {...comment}
            />
          ))
        )}
      </div>
    </motion.aside>
  );
};

const InputVariants = {
  closed: { opacity: 0, scale: 0, transition: { delay: 0.35 } },
  open: { opacity: 1, scale: 1, transition: { delay: 0.1 } },
};

const InputTypeVariants = {
  closed: { top: 0, opacity: 0, transition: { delay: 0.1 } },
  open: {
    top: "-3.5rem",
    opacity: 1,
    transition: { delay: 0.35 },
  },
};

export default function Editor({ params: { id } }: { params: { id: string } }) {
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [meta, setMeta] = useState<Book>();
  const [[width, height], setDimensions] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    if (width || height) return;

    setDimensions([600, window.innerHeight - 120]);
  }, []);

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
  const [promptText, setPromptText] = useState<string>("");
  const [prompting, setPrompting] = useState<boolean>(true);
  const [focusedPageNumber, setFocusedPageNumber] = useState<number | null>(
    null
  );
  const [aiResponse, setAiResponse] = useState<{
    preamble: string;
    content: string;
  }>({ preamble: "", content: "" });
  const [highlightBlob, setHighlightBlob] = useState<Blob | null>(null);
  const [locked, setLocked] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (!menuOpen) {
      setPromptText("");
    }
  }, [menuOpen]);

  const handleSubmitPrompt = async () => {
    if (!promptText || !meta || !user) return;

    if (!prompting) {
      try {
        setLocked(true);
        const commentCol = collection(db, "comments").withConverter(CommentConverter);
        const newComment: Comment = {
          id: '', // This will be set by Firestore
          bookUid: id,
          content: promptText,
          pageNumber: focusedPageNumber || 1,
          likes: [],
          userUid: user.uid,
          postedOn: new Date(),
        };
        await addDoc(commentCol, newComment);
        setPromptText("");
      } catch (e) {
        console.error("Error adding document: ", e);
      } finally {
        setLocked(false);
      }
    } else {
      if (!highlightBlob) {
        return;
      }

      setLocked(true);
      setAiResponse({ preamble: "", content: "" });
      setPromptText("");
      const imgArray = new Uint8Array(await highlightBlob.arrayBuffer());
      await textHandler(
        promptText,
        imgArray,
        (
          text: string | { preamble: string; content: string },
          isFinal: boolean = false
        ) => {
          if (isFinal && typeof text === "string") {
            const { preamble, content } = JSON.parse(text);
            setAiResponse({ preamble, content });
          } else {
            setAiResponse((prev) => ({
              ...prev,
              content: prev.content + text,
            }));
          }
        }
      );
      setLocked(false);
    }
  };

  useEffect(() => {
    if (!id || !focusedPageNumber) return;

    const commentsQuery = query(
      collection(db, "comments").withConverter(CommentConverter),
      where("bookUid", "==", id),
      where("pageNumber", "==", focusedPageNumber)
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const newComments = snapshot.docs.map(doc => doc.data());
      setComments(newComments);
    });

    return () => unsubscribe();
  }, [id, focusedPageNumber]);

  const variant = menuOpen ? "open" : "closed";

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
      ) : meta ? (
        <>
          <div className={styles.header}>{meta.title}</div>
          <div className={styles.contentLayout}>
            <div className={styles.pdf}>
              <PDFViewer
                pdfId={id}
                width={width || 200}
                height={height || 200}
                setPageNumber={setFocusedPageNumber}
                setHighlightBlob={setHighlightBlob}
                openCommentary={() => setMenuOpen(true)}
                closeCommentary={() => setMenuOpen(false)}
              />
              <div className={styles.inputWrapper}>
                <motion.div
                  className={styles.inputType}
                  variants={InputTypeVariants}
                  initial="closed"
                  animate={variant}
                  transition={{ delay: menuOpen ? 0 : 0.25 }}
                >
                  <button
                    className={`${prompting ? styles.selected : undefined}`}
                    onClick={() => setPrompting(true)}
                  >
                    Ask AI
                  </button>
                  <button
                    className={`${prompting ? undefined : styles.selected}`}
                    onClick={() => setPrompting(false)}
                  >
                    Comment
                  </button>
                </motion.div>
                <motion.div
                  className={styles.input}
                  variants={InputVariants}
                  initial="closed"
                  animate={variant}
                  transition={{ duration: 0.25, delay: 0.1 }}
                >
                  <textarea
                    className={styles.textArea}
                    placeholder={
                      prompting
                        ? "Ask AI your question!"
                        : "Contribute your thoughts!"
                    }
                    onChange={(e) =>
                      e.target.value.at(-1) !== "\n" &&
                      setPromptText(e.target.value)
                    }
                    value={promptText}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSubmitPrompt();
                      }
                    }}
                  />
                  <div className={styles.actions}>
                    <button
                      className={styles.submit}
                      disabled={locked}
                      onClick={handleSubmitPrompt}
                    >
                      {locked ? (
                        <Loader width="1.5rem" height="1.5rem" />
                      ) : (
                        <BiRightArrowAlt color="white" size={20} />
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
            <Sidebar
              id={id}
              menuOpen={menuOpen}
              toggleMenuOpen={() => setMenuOpen((prev) => !prev)}
              isCommenting={!prompting}
              pageNumber={focusedPageNumber || 1}
              aiBreakdown={aiResponse}
              comments={comments}
            />
          </div>
        </>
      ) : (
        <div>Error: Book not found</div>
      )}
    </div>
  );
}
