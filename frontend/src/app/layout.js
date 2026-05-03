import "./globals.css";
import ThemeToggle from '@/components/ThemeToggle';

export const metadata = {
  title: "Math Tutor AI",
  description: "Adaptive learning platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="dark-mode" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.body.classList.add('light-mode');
                    document.body.classList.remove('dark-mode');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {children}
        <ThemeToggle floating={true} />
      </body>
    </html>
  );
}
