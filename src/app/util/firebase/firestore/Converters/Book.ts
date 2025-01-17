import { Book } from "@/app/types/Book";
import {
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";

export const BookConverter = {
  toFirestore: (book: Book) => {
    return {
      global: book.global,
      id: book.id,
      title: book.title,
      lastOpened: book.lastOpened,
      ownerUid: book.ownerUid,
    };
  },
  fromFirestore: (
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ) => {
    const data = snapshot.data(options)!;
    return {
      global: data.global,
      id: data.id,
      title: data.title,
      lastOpened: (data.lastOpened as Timestamp).toDate(),
      ownerUid: data.ownerUid,
    };
  },
};
