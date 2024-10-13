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
} from "firebase/firestore";
import { db } from "@/app/util/firebase/firestore/init";
import { Loader } from "@/app/Components/Loader";
import { CommentConverter } from "@/app/util/firebase/firestore/Converters/Comments";
import { Comment } from "@/app/types/Comment";
import PDFViewer from "@/app/Components/PDFViewer";
import { motion } from "framer-motion";
import {
  BiPause,
  BiPlay,
  BiRightArrowAlt,
  BiSolidComment,
  BiStop,
  BiX,
} from "react-icons/bi";
import { FaMicrophone, FaPause, FaPlay, FaStop } from "react-icons/fa";
import { textHandler } from "@/app/util/aws";
import { useAuth } from "@/app/context/Auth";
import {
  MathJaxContext as BetterMathJaxContext,
  MathJax as BetterMathJax,
} from "better-react-mathjax";
import useSpeechRecognition from "@/app/util/useSpeechRecognition";
import { ttsHandler } from "@/app/util/tts";
import { FiPlay } from "react-icons/fi";
import { redirect } from "next/navigation";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

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

const CommentItem = ({ content, likes, userUid, postedOn }: Comment) => {
  return <div>{content}</div>;
};

interface SidebarProps {
  id: string;
  menuOpen: boolean;
  toggleMenuOpen: () => void;
  pageNumber: number;
  isCommenting: boolean;
  aiBreakdown: { preamble: string; content: string };
  playAudio: () => void;
  loadingAudio: boolean;
  pauseAudio: () => void;
}

const Sidebar = ({
  id,
  menuOpen,
  toggleMenuOpen,
  pageNumber,
  aiBreakdown,
  playAudio,
  loadingAudio,
  pauseAudio,
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

  useEffect(() => {
    console.log(comments);
  }, [comments]);

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
        <div className={styles.subheader}>
          <span className={styles.heading}>AI Breakdown</span>
          {aiBreakdown.content && (
            <button
              className={styles.play}
              disabled={loadingAudio}
              onClick={playAudio}
            >
              {loadingAudio ? <Loader color="var(--dark)" /> : <FaPlay />}
            </button>
          )}
        </div>
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
  useEffect(() => {
    if (!menuOpen) {
      setPromptText("");
    }
  }, [menuOpen]);

  const handleSubmitPrompt = async () => {
    if (!promptText || !meta) return;

    if (!prompting) {
      try {
        setLocked(true);
        const commentCol = collection(db, "comments").withConverter(
          CommentConverter
        );
        const newComment: Comment = {
          id: window.crypto.randomUUID(),
          content: promptText,
          bookUid: id,
          pageNumber: focusedPageNumber || 1,
          likes: 0,
          postedOn: new Date(),
          userUid: user!.uid,
        };
        await addDoc(commentCol, newComment);
      } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
      } finally {
        setLocked(false);
      }
      setPromptText("");
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

  const { isRecording, handleToggleRecording } = useSpeechRecognition({
    setInputText: setPromptText,
  });

  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [loadingAudio, setLoadingAudio] = useState<boolean>(false);
  const handleTTS = async () => {
    if (!audio) {
      setLoadingAudio(true);
      const buffer = await ttsHandler(aiResponse.content);
      setLoadingAudio(false);
      const blob = new Blob([buffer], { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);
      const newAudio = new Audio(url);
      setAudio(newAudio);
      newAudio.play();
    } else {
      audio.play();
    }
  };
  const pauseTTS = async () => {
    if (audio) {
      audio?.pause();
    }
  };

  if (!loading && !meta) {
    redirect("/dashboard");
  }

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
      ) : (
        <>
          <div className={styles.header}>{meta!.title}</div>
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
                      onClick={handleToggleRecording}
                    >
                      {isRecording ? (
                        <FaStop color="white" size={9} />
                      ) : (
                        <FaMicrophone color="white" size={12} />
                      )}
                    </button>
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
              pageNumber={0}
              aiBreakdown={aiResponse}
              playAudio={handleTTS}
              loadingAudio={loadingAudio}
              pauseAudio={pauseTTS}
            />
          </div>
        </>
      )}
    </div>
  );
}
