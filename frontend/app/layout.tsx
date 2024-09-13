import "./globals.css"
import React, { ReactNode } from "react"

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
