import jsPDF from "jspdf"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt?: Date
}

interface Analytics {
  totalSessions: number
  totalTime: number
  questionsAsked: number
  subjectsStudied: Record<string, number>
}

export async function generatePDF(messages: Message[], analytics: Analytics) {
  const pdf = new jsPDF()

  // Set up the document
  pdf.setFontSize(20)
  pdf.text("NEET Study Bot - Chat History", 20, 20)

  pdf.setFontSize(12)
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35)

  // Add analytics summary
  pdf.setFontSize(14)
  pdf.text("Study Summary:", 20, 50)

  pdf.setFontSize(10)
  pdf.text(`Total Questions Asked: ${analytics.questionsAsked}`, 20, 60)
  pdf.text(`Total Study Sessions: ${analytics.totalSessions}`, 20, 70)

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  pdf.text(`Total Study Time: ${formatTime(analytics.totalTime)}`, 20, 80)

  // Add subject breakdown
  let yPos = 95
  pdf.text("Subject Breakdown:", 20, yPos)
  yPos += 10

  Object.entries(analytics.subjectsStudied).forEach(([subject, count]) => {
    pdf.text(`${subject.charAt(0).toUpperCase() + subject.slice(1)}: ${count} questions`, 25, yPos)
    yPos += 8
  })

  // Add chat history
  yPos += 15
  pdf.setFontSize(14)
  pdf.text("Chat History:", 20, yPos)
  yPos += 15

  pdf.setFontSize(10)

  messages.forEach((message, index) => {
    // Check if we need a new page
    if (yPos > 270) {
      pdf.addPage()
      yPos = 20
    }

    // Add message header
    const role = message.role === "user" ? "You" : "AI Tutor"
    pdf.setFont(undefined, "bold")
    pdf.text(`${role}:`, 20, yPos)
    yPos += 8

    // Add message content
    pdf.setFont(undefined, "normal")
    const lines = pdf.splitTextToSize(message.content, 170)

    lines.forEach((line: string) => {
      if (yPos > 270) {
        pdf.addPage()
        yPos = 20
      }
      pdf.text(line, 25, yPos)
      yPos += 6
    })

    yPos += 5 // Add space between messages
  })

  // Save the PDF
  const fileName = `NEET-Study-Chat-${new Date().toISOString().split("T")[0]}.pdf`
  pdf.save(fileName)
}
