import "./globals.css";

export const metadata = { title: "Affiliate Content Automation", description: "AI-powered affiliate short video production platform" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
