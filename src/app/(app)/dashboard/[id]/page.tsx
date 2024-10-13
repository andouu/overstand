"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.scss";
import { Book } from "@/app/types/Book";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/util/firebase/firestore/init";
import { redirect } from "next/navigation";
import { getBlob, getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/app/util/firebase/storage/init";
import { LoadingPage } from "@/app/Components/LoadingPage";

export default function Editor({ params: { id } }: { params: { id: string } }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [meta, setMeta] = useState<Book>();
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setLoading(true);

        const metaRef = query(collection(db, "books"), where("id", "==", id));
        const metaSnap = await getDocs(metaRef);
        if (metaSnap.empty) return;

        const meta = metaSnap.docs[0].data() as Book;

        const fileRef = ref(storage, `books/${id}`);
        const blob = await getBlob(fileRef);

        setPdfFile(new File([blob], meta.title, { type: "application/pdf" }));
        setMeta(meta);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [id]);

  if (!loading && (!meta || !pdfFile)) {
    redirect("/dashboard");
  }

  return (
    <div className={styles.layout}>
      <div className={styles.header}></div>
    </div>
  );
}
