import React, { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import PDFHighlighter from "./PDFHighlighter";
import Messages from "./Messages";
import { addMessage } from "./FirebaseService";
import { textHandler } from "../aws";
import "katex/dist/katex.min.css";
import Latex from "react-latex-next";

const Viewer: React.FC = () => {
  const [commentaryOpen, setCommentaryOpen] = useState<boolean>(false);
  const [commPageNumber, setCommPageNumber] = useState<number | null>(null);
  const [inputText, setInputText] = useState<string>("");
  const [highlightBlob, setHighlightBlob] = useState<Blob>();
  const [isWritingNewMessage, setIsWritingNewMessage] =
    useState<boolean>(false);
  const [messageUpdateTrigger, setMessageUpdateTrigger] = useState<number>(0);
  const [aiResponsePreamble, setAiResponsePreamble] = useState("");
  const [aiResponseContent, setAiResponseContent] = useState("");
  const aiResponseRef = useRef<HTMLTextAreaElement>(null);

  const openCommentary = (pageNumber: number, highlightBlob: Blob | null) => {
    if (!highlightBlob) return;
    setInputText("");
    setCommentaryOpen(true);
    setCommPageNumber(pageNumber);
    setHighlightBlob(highlightBlob);
  };

  const closeCommentary = () => {
    setCommentaryOpen(false);
    setCommPageNumber(null);
    setInputText("");
    setIsWritingNewMessage(false);
  };

  const handleSubmitInput = async () => {
    if (inputText === "" || !highlightBlob) return;

    if (isWritingNewMessage) {
      // Post new message
      await addMessage({
        Content: inputText,
        DocName: "folland", // Assuming 'folland' is the current document
        PageNumber: commPageNumber || 1,
        Stars: 0,
        UserID: "currentUser", // Replace with actual user ID when implemented
      });
      setInputText("");
      setMessageUpdateTrigger((prev) => prev + 1); // Trigger message update
    } else {
      // Handle AI tool interaction
      setAiResponsePreamble("");
      setAiResponseContent("");
      const imgArray = new Uint8Array(await highlightBlob.arrayBuffer());
      await textHandler(
        inputText,
        imgArray,
        (
          text: string | { preamble: string; content: string },
          isFinal: boolean = false
        ) => {
          if (isFinal && typeof text === "string") {
            const { preamble, content } = JSON.parse(text);
            setAiResponsePreamble(preamble);
            setAiResponseContent(content);
          } else {
            setAiResponseContent((prev) => prev + text);
          }
          if (aiResponseRef.current) {
            aiResponseRef.current.scrollTop =
              aiResponseRef.current.scrollHeight;
          }
        }
      );
    }
  };

  const toggleIsWritingNewMessage = useCallback(() => {
    setIsWritingNewMessage((prev) => !prev);
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <PDFHighlighter
          pdfUrl="FollandSection.pdf"
          width={600}
          height={700}
          minSelWidth={15}
          minSelHeight={15}
          openCommentary={openCommentary}
          closeCommentary={closeCommentary}
        />
        <motion.div
          animate={{
            opacity: commentaryOpen ? 1 : 0,
            width: commentaryOpen ? 500 : 0,
            height: commentaryOpen ? 80 : 0,
            borderRadius: commentaryOpen ? 10 : 100,
          }}
          transition={{ duration: 0.3 }}
          style={{ overflow: "hidden", border: "2px solid red" }}
        >
          <textarea
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
          />
        </motion.div>
        <motion.div
          animate={{ opacity: commentaryOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            style={{ borderRadius: 10, height: "40px" }}
            onClick={handleSubmitInput}
          >
            {isWritingNewMessage ? "Post Message!" : "Ask AI!"}
          </button>
        </motion.div>
      </div>
      <motion.div
        style={{ backgroundColor: "gray" }}
        animate={{
          opacity: commentaryOpen ? 1 : 0,
          width: commentaryOpen ? "50vw" : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        {/* AI Response with LaTeX rendering */}
        <div
          style={{
            width: "100%",
            height: 200,
            border: "2px solid blue",
            overflow: "auto",
            padding: "10px",
          }}
        >
          <Latex macros={{ "\\RR": "\\mathbb{R}" }}>
            {`${aiResponsePreamble}\n${aiResponseContent}`}
          </Latex>
        </div>
        {commPageNumber && (
          <Messages
            docName="folland"
            pageNumber={commPageNumber}
            isWritingNewMessage={isWritingNewMessage}
            setIsWritingNewMessage={toggleIsWritingNewMessage}
            updateTrigger={messageUpdateTrigger}
          />
        )}
      </motion.div>
    </div>
  );
};

export default Viewer;
