"use client";
import styles from "./page.module.scss";
import { BiTrash, BiUpload, BiX } from "react-icons/bi";
import { UnstyledLink } from "@/app/Components/UnstyledLink";
import { useAuth } from "@/app/context/Auth";
import { ChangeEvent, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/app/util/firebase/firestore/init";
import { Book } from "@/app/types/Book";
import { BookConverter } from "@/app/util/firebase/firestore/Converters/Book";
import { AnimatePresence, motion } from "framer-motion";
import { Loader } from "@/app/Components/Loader";
import { deleteObject, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/app/util/firebase/storage/init";

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
          Add a new book to your library.
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

type BookRowProps = Book;

const BookRow = ({ id, title, lastOpened }: BookRowProps) => {
  const [deleting, setDeleting] = useState<boolean>(false);

  const handleDeleteBook = async (id: string) => {
    try {
      setDeleting(true);

      const bookQuery = await getDocs(
        query(collection(db, "books"), where("id", "==", id))
      );
      if (bookQuery.empty) {
        console.error("Book not found");
        return;
      } else {
        const fileRef = ref(storage, `books/${id}`);
        await deleteObject(fileRef);

        const bookDoc = bookQuery.docs[0];
        await deleteDoc(bookDoc.ref);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`${styles.row} ${deleting ? styles.disabled : undefined}`}>
      <UnstyledLink href={`/dashboard/${id}`}>
        <span className={styles.name}>{title}</span>
      </UnstyledLink>
      <div className={styles.actions}>
        <span className={styles.date}>{lastOpened.toLocaleDateString()}</span>
        <button onClick={() => handleDeleteBook(id)}>
          {deleting ? (
            <Loader
              width="1.5rem"
              height="1.5rem"
              thickness="1.75px"
              color="var(--dark)"
            />
          ) : (
            <BiTrash size={18} />
          )}
        </button>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // user is guaranteed to exist because this is a protected route
  const { user } = useAuth();

  useEffect(() => {
    const libraryQuery = query(
      collection(db, "books").withConverter(BookConverter),
      where("ownerUid", "==", user!.uid)
    );

    const unsubscribe = onSnapshot(libraryQuery, (snapshot) =>
      setBooks(snapshot.docs.map((doc) => doc.data() as Book))
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className={styles.layout}>
      <AnimatePresence>
        {modalOpen && <Modal closeModal={() => setModalOpen(false)} />}
      </AnimatePresence>
      <div className={styles.header}>
        <h1>My Library</h1>
        <button className={styles.addBook} onClick={() => setModalOpen(true)}>
          Add Book
        </button>
      </div>
      {books.length === 0 ? (
        <span className={styles.note}>Your library is empty. Add a book!</span>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Name</span>
            <span>Last Opened</span>
          </div>
          {books.map(({ id, title, lastOpened, ownerUid }) => (
            <BookRow
              key={id}
              id={id}
              title={title}
              lastOpened={lastOpened}
              ownerUid={ownerUid}
            />
          ))}
        </div>
      )}
    </div>
  );
}
