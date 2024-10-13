"use client";
import { useEffect, useState } from "react";
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
import { db } from "@/app/util/firebase/firestore/init";

type BookRowProps = Book & { userUid: string };

const BookRow = ({ id, title, lastOpened, userUid }: BookRowProps) => {
  const [adding, setAdding] = useState<boolean>(false);

  const handleAddBook = async (id: string) => {
    try {
      setAdding(true);

      const userBooksQuery = query(
        collection(db, "books"),
        where("ownerUid", "==", userUid),
        where("id", "==", id)
      );
      const userBooksSnap = await getDocs(userBooksQuery);
      if (userBooksSnap.empty) {
        const doc = { id, title, lastOpened, ownerUid: userUid };
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
  // books which are not in my library
  const [books, setBooks] = useState<Book[]>([]);

  // user is guaranteed to exist because this is a protected route
  const { user } = useAuth();

  useEffect(() => {
    const libraryQuery = query(
      collection(db, "books").withConverter(BookConverter),
      where("ownerUid", "!=", user!.uid)
    );

    const unsubscribe = onSnapshot(libraryQuery, (snapshot) =>
      setBooks(snapshot.docs.map((doc) => doc.data() as Book))
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className={styles.layout}>
      <h1>Global Library</h1>
      {books.length === 0 ? (
        <span className={styles.note}>You own every book!</span>
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
              userUid={user!.uid}
            />
          ))}
        </div>
      )}
    </div>
  );
}
