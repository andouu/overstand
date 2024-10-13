import { Comment } from "@/app/types/Comment";
import {
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";

export const CommentConverter = {
  toFirestore: (comment: Comment) => {
    return {
      bookUid: comment.bookUid,
      content: comment.content,
      pageNumber: comment.pageNumber,
      likes: comment.likes,
      userUid: comment.userUid,
      postedOn: comment.postedOn,
    };
  },
  fromFirestore: (
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Comment => {
    const data = snapshot.data(options)!;
    return {
      id: snapshot.id,
      bookUid: data.bookUid,
      content: data.content,
      pageNumber: data.pageNumber,
      likes: data.likes || [],
      userUid: data.userUid,
      postedOn: (data.postedOn as Timestamp).toDate(),
    };
  },
};
