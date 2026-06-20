import '../styles/globals.css';

export const metadata = {
  title: 'FurniERP — Modular Furniture Production',
  description: 'End-to-end production management for modular furniture manufacturing',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
