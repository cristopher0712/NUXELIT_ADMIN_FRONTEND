import html2pdf from 'html2pdf.js';

export const generateEstimationPdf = async (htmlContent, filename) => {
  // Parse the raw HTML content string into a DOM structure
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  // Extract the styling and the main printable page block
  const templateStyle = doc.querySelector('style');
  const pageElement = doc.querySelector('.page');
  
  if (!pageElement) {
    throw new Error('No se pudo encontrar el contenedor ".page" en la estimación renderizada.');
  }

  // Create a temporary stylesheet in the main active document head
  // This guarantees the parent page context can resolve all styles when html2pdf clones the element
  const tempStyle = document.createElement('style');
  tempStyle.id = 'temp-pdf-styles';
  tempStyle.innerHTML = templateStyle ? templateStyle.innerHTML : '';
  document.head.appendChild(tempStyle);
  
  // Create a temporary container in the active viewport
  // We position it at left: 0; top: 0; but z-index: -9999 to render it behind the page body.
  // This ensures the browser treats it as visible/active and paints it (fixing the blank/white PDF bug),
  // but it remains completely hidden from the user underneath the dark admin theme.
  const tempContainer = document.createElement('div');
  tempContainer.id = 'temp-pdf-container';
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '0';
  tempContainer.style.top = '0';
  tempContainer.style.width = '210mm'; // Standard A4 width
  tempContainer.style.backgroundColor = '#ffffff';
  tempContainer.style.zIndex = '-9999';
  tempContainer.style.pointerEvents = 'none'; // Prevent any mouse interaction
  
  // Clone the printable page node and append it to our temporary container
  const pageClone = pageElement.cloneNode(true);
  tempContainer.appendChild(pageClone);
  document.body.appendChild(tempContainer);
  
  // Give the browser layout and painting engine a short moment to apply the styles
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const opt = {
    margin: [14, 13, 15, 13],
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      logging: false
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] }
  };
  
  try {
    // Generate and save the PDF using html2pdf
    await html2pdf().set(opt).from(tempContainer).save();
  } finally {
    // Clean up style and container from active document to prevent any side effects
    if (tempStyle.parentNode) {
      tempStyle.parentNode.removeChild(tempStyle);
    }
    if (tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
  }
};
