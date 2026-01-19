import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { NavHeader } from "@/components/nav-header";
import "./globals.css";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Cursor AI Usage Dashboard",
	description: "Track and analyze team AI activity scores across all Cursor features including accepted lines, tab accepts, and chat requests",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={inter.variable}>
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<NavHeader />
				<main className="min-h-[calc(100vh-3.5rem)]">
					{children}
				</main>
			</body>
		</html>
	);
}
