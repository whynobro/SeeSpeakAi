import type { Metadata } from 'next';
import { Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { BirdMascot } from '@/components/bird/BirdMascot';
import { TabBar } from '@/components/TabBar';
import { ViewModeFrame } from '@/components/ViewModeFrame';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SeeSpeak',
  description: 'Practice the speech sounds your ears miss',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ViewModeFrame>
          {/* Room at the bottom so the fixed tab bar never covers the end of a page. */}
          <div className="flex flex-1 flex-col pb-24">{children}</div>
          <TabBar />
          <BirdMascot />
        </ViewModeFrame>
      </body>
    </html>
  );
}
