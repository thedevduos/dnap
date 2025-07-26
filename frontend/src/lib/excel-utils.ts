import * as XLSX from 'xlsx'

export async function exportToExcel(data: any[], filename: string) {
  // Prepare the data for export
  const exportData = data.map(item => ({
    'Applicant Name': item.fullName || '',
    'Email': item.email || '',
    'Phone': item.phone || '',
    'Job Title': item.jobTitle || '',
    'Experience': item.experience || '',
    'Status': item.status || '',
    'Applied Date': item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : '',
    'Cover Letter': item.coverLetter || '',
    // Add custom questions if they exist
    ...(item.answers && Object.keys(item.answers).length > 0 ? 
      Object.fromEntries(
        Object.entries(item.answers).map(([key, value]) => [`Question ${key}`, value])
      ) : {}
    )
  }))

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(exportData)

  // Auto-size columns
  const columnWidths = Object.keys(exportData[0] || {}).map(key => ({
    wch: Math.max(key.length, 15)
  }))
  worksheet['!cols'] = columnWidths

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications')

  // Generate and download file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
} 