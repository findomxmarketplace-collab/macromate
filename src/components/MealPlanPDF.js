import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export function downloadPDF(planElement) {
  const licenseKey = prompt('Enter your license key to download the PDF:')
  if (!licenseKey || licenseKey.trim() === '') {
    alert('A valid license key is required to download the meal plan.')
    return false
  }

  // Any non-empty string is accepted
  alert('License key accepted! Generating your PDF...')

  // Generate PDF from the plan element
  html2canvas(planElement, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    height: planElement.scrollHeight,
    windowHeight: planElement.scrollHeight,
  }).then((canvas) => {
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    const imgWidth = pdfWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    let heightLeft = imgHeight
    let position = 0
    
    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pdfHeight
    
    // Add additional pages if content overflows
    while (heightLeft > 0) {
      position = position - pdfHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight
    }
    
    pdf.save('MacroMate_Meal_Plan.pdf')
  })

  return true
}

export default downloadPDF