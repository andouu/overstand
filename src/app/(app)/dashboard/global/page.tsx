"use client";
import { ChangeEvent, useEffect, useState } from "react";
import { BiUpload, BiX } from "react-icons/bi";
import styles from "./page.module.scss";
import { Book } from "@/app/types/Book";
import { UnstyledLink } from "@/app/Components/UnstyledLink";
import { Loader } from "@/app/Components/Loader";
import { BiPlus } from "react-icons/bi";
import { useAuth } from "@/app/context/Auth";
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { BookConverter } from "@/app/util/firebase/firestore/Converters/Book";
import { AnimatePresence, motion } from "framer-motion";
import { db } from "@/app/util/firebase/firestore/init";
import { storage } from "@/app/util/firebase/storage/init";
import { ref, uploadBytes } from "firebase/storage";

interface ModalProps {
  closeModal: () => void;
}

const Modal = ({ closeModal }: ModalProps) => {
  const { user } = useAuth();

  const [title, setTitle] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files ? e.target.files[0] : null);
  };

  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  useEffect(() => setError(""), [title, file]);

  const handleUpload = async () => {
    if (!file || !title) return;

    try {
      setUploading(true);
      const doc: Book = {
        global: true,
        id: window.crypto.randomUUID(),
        title,
        lastOpened: new Date(),
        ownerUid: user!.uid,
      };

      const fileRef = ref(storage, `books/${doc.id}`);
      await uploadBytes(fileRef, file);

      await addDoc(collection(db, "books").withConverter(BookConverter), doc);
      closeModal();
    } catch (err) {
      console.error(err);
      setError(err as string);
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      key="modal"
      className={styles.modal}
      onClick={(e) => e.target === e.currentTarget && closeModal()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      tabIndex={0}
    >
      <div className={styles.form}>
        <div className={styles.modalHeader}>
          <h2>New Book</h2>
          <button onClick={closeModal}>
            <BiX size={25} />
          </button>
        </div>
        <span className={styles.description}>
          Add a new book to the global library.
        </span>
        <input
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Book Title"
        />
        <div className={styles.fileInput}>
          <span className={styles.name}>
            {file ? file.name : "Choose File"}
          </span>
          <label className={styles.slot} htmlFor="file">
            <BiUpload color="gray" />
          </label>
          <input
            id="file"
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileUpload(e)}
          />
        </div>
        {error && <span className={styles.error}>{error}</span>}
        <button
          className={styles.add}
          disabled={!title || !file || uploading}
          onClick={handleUpload}
        >
          {uploading ? (
            <Loader width="1.5rem" height="1.5rem" color="white" />
          ) : (
            "Add Book"
          )}
        </button>
      </div>
    </motion.div>
  );
};

type BookRowProps = Book & { userUid: string };

const BookRow = ({ id, title, lastOpened, userUid }: BookRowProps) => {
  const [adding, setAdding] = useState<boolean>(false);

  const handleAddBook = async (id: string) => {
    try {
      setAdding(true);

      const userBooksQuery = query(
        collection(db, "books"),
        where("global", "==", false),
        where("ownerUid", "==", userUid),
        where("id", "==", id)
      );
      const userBooksSnap = await getDocs(userBooksQuery);
      if (userBooksSnap.empty) {
        const doc: Book = { // generate new book deep copy
          global: false,
          id,
          title,
          lastOpened: new Date(),
          ownerUid: userUid,
        };
  
        await addDoc(collection(db, "books").withConverter(BookConverter), doc);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={`${styles.row} ${adding ? styles.disabled : undefined}`}>
      <UnstyledLink href={`/dashboard/${id}`}>
        <span className={styles.name}>{title}</span>
      </UnstyledLink>
      <div className={styles.actions}>
        <span className={styles.date}>{lastOpened.toLocaleDateString()}</span>
        <button onClick={() => handleAddBook(id)}>
          {adding ? (
            <Loader
              width="1.5rem"
              height="1.5rem"
              thickness="1.75px"
              color="var(--dark)"
            />
          ) : (
            <BiPlus size={18} />
          )}
        </button>
      </div>
    </div>
  );
};

export default function Global() {
  const [books, setBooks] = useState<Book[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // user is guaranteed to exist because this is a protected route
  const { user } = useAuth();

  useEffect(() => {
    const libraryQuery = query(
      collection(db, "books").withConverter(BookConverter),
      where("global", "==", true) // display only globally flagged books
    );

    const unsubscribe = onSnapshot(libraryQuery, (snapshot) =>
      setBooks(snapshot.docs.map((doc) => doc.data() as Book))
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <div className={styles.layout}>
      <AnimatePresence>
        {modalOpen && <Modal closeModal={() => setModalOpen(false)} />}
      </AnimatePresence>
      <div className={styles.header}>
        <h1>Global Library</h1>
        <button className={styles.addBook} onClick={() => setModalOpen(true)}>
          Add Book
        </button>
      </div>
      {books.length === 0 ? (
        <span className={styles.note}>You own every book!</span>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Name</span>
            <span>Last Opened</span>
          </div>
          {books.map(({ global, id, title, lastOpened, ownerUid }) => (
            <BookRow
              global={global}
              key={id}
              id={id}
              title={title}
              lastOpened={lastOpened}
              ownerUid={ownerUid}
              userUid={user!.uid}
            />
          ))}
        </div>
      )}
    </div>
  );
}
