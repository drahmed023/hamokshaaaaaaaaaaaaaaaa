import React from 'react';

function NotionScreen() {
  return (
    // Use negative margins to break out of the parent container's padding,
    // making the view much larger. Adjust height to fill viewport below the header.
    // Added a subtle border and shadow to give it a nice frame as requested.
    <div className="-mx-4 -my-8 h-[calc(100vh-4rem)] rounded-lg overflow-hidden shadow-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <iframe
        src="https://inte7rnal-medicine.super.site/"
        title="Internal Medicine Notion Site"
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      ></iframe>
    </div>
  );
}

export default NotionScreen;
