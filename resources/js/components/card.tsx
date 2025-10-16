import { Button, Card as FlowbiteCard, Modal } from "flowbite-react";
import React, { useState } from "react";
import { motion } from "framer-motion";
import FileUploader from "@/components/FileUploader";

interface AppCardProps {
  title: string;
  description: string;
  href?: string;
  icon?: React.ElementType;
  color?: string;
}

export function Card({
  title,
  description,
  icon: Icon,
  color = "text-blue-500",
}: AppCardProps) {
  const [openModal, setOpenModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleUpload = () => {
    if (!uploadedFile) {
      alert("Pilih file terlebih dahulu!");
      return;
    }

    console.log("Uploading file:", uploadedFile.name);
   
    setTimeout(() => {
      alert(`File "${uploadedFile.name}" berhasil diupload!`);
      setOpenModal(false);
      setUploadedFile(null);
    }, 1000);
  };

  return (
    <>
      {/* Kartu utama */}
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <FlowbiteCard
          className="max-w-sm h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                     shadow-md hover:shadow-xl rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden"
        >
          <div className="flex flex-col justify-between h-full">
            <div>
              {/* Icon */}
              {Icon && (
                <div
                  className={`flex items-center justify-center w-12 h-12 mb-3 rounded-xl
                    bg-gradient-to-br from-blue-100 to-blue-50 dark:from-gray-700 dark:to-gray-600`}
                >
                  <Icon className={`h-7 w-7 ${color}`} />
                </div>
              )}

              {/* Title */}
              <h5 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-2">
                {title}
              </h5>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {description}
              </p>
            </div>

            {/* Button Upload */}
            <Button
              type="button"
              className="mt-4 w-fit group bg-blue-600 hover:bg-blue-700 text-white"
              onClick={(e) => {
                e.stopPropagation();
                setOpenModal(true);
              }}
            >
              <span className="flex items-center">
                Upload Dokumen
                <svg
                  className="-mr-1 ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </Button>
          </div>
        </FlowbiteCard>
      </motion.div>

      {/* Modal Upload File */}
   {/* Modal Upload File */}
<Modal
  show={openModal}
  onClose={() => setOpenModal(false)}
  size="lg"
  className="z-[9999]"
>
  <div className="relative p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl transition-all">

    {/* Tombol Close Bulat */}
    <button
      type="button"
      onClick={() => setOpenModal(false)}
      className="absolute top-3 right-3 inline-flex items-center justify-center 
                 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 
                 text-gray-600 dark:text-gray-300 
                 hover:bg-gray-200 dark:hover:bg-gray-600 
                 hover:text-gray-900 dark:hover:text-white 
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                 transition-all"
      aria-label="Close modal"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    {/* Header Modal */}
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Upload Dokumen
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Pilih atau seret file ke area di bawah ini. Hanya CSV / XLSX (maks 10MB).
      </p>
    </div>

    {/* FileUploader */}
    <FileUploader
      server="/upload"
      onUpdate={(file) => setUploadedFile(file)}
      acceptedTypes={[
        "text/csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]}
      maxFileSize="10MB"
    />

    {/* Tombol Aksi */}
    {/* <div className="flex justify-end gap-2 mt-6">
      <Button
        color="gray"
        type="button"
        onClick={() => setOpenModal(false)}
        className="hover:bg-gray-200 dark:hover:bg-gray-700 transition"
      >
        Batal
      </Button>
      <Button
        type="button"
        onClick={handleUpload}
        disabled={!uploadedFile}
        className="bg-blue-600 hover:bg-blue-700 transition"
      >
        Upload
      </Button>
    </div> */}
  </div>
</Modal>

    </>
  );
}
