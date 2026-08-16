import "./globals.css";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import { Noto_Nastaliq_Urdu } from 'next/font/google';

const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };

const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-noto-nastaliq',
  display: 'swap',
});

export const metadata = {
  title: "VU SIGMA | Virtual University Past Papers & Exam Portal",
  description: "Prepare for Virtual University midterm and final term exams with solved past papers, interactive MCQs, short/long questions, and subject study guides.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoNastaliqUrdu.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
