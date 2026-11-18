// Layout raíz del admin — sin protección, solo estructura básica
// La protección la maneja (protected)/layout.tsx
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
