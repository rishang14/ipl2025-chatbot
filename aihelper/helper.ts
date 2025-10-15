import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";

export async function scrapePage(url: string) {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions:{
        headless:true
    },
    gotoOptions:{
        waitUntil:"domcontentloaded"
    }, 
    evaluate: async(page,browser)=>{
      const res= await page.evaluate(()=>document.body.textContent.trim()); 
       browser.close();
       return res;
    }
  });

return (await loader.scrape())?.replace(/<[^>]*>?/gm,'')
}
