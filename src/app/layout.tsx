import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { NavHeader } from "@/components/nav-header";
import { ThemeProvider } from "@/components/theme-provider";
import { PrivacyProvider } from "@/components/privacy-provider";
import { AuthError } from "@/components/auth-error";
import { BugReportButton } from "@/components/bug-report-button";
import "./globals.css";

// Force dynamic rendering for all pages since NavHeader needs session
export const dynamic = 'force-dynamic';

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

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
	userScalable: true,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={inter.variable} suppressHydrationWarning>
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<PrivacyProvider>
						<NavHeader />
						{/* Auth error display for failed sign-ins */}
						<Suspense fallback={null}>
							<AuthError />
						</Suspense>
						<main className="min-h-[calc(100vh-3.5rem)]">
							{children}
						</main>
						{/* Floating bug report button - appears on all pages */}
						<BugReportButton />
					</PrivacyProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
