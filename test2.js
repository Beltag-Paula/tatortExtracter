const { JSDOM } = require("jsdom");
const { pipeline } = require("node:stream/promises");
const fs = require("node:fs");

const myURL = "https://tatort-fans.de/category/stadt-archiv/tatort-muenster/";

function getAllTitles(titles) {
  return titles.map((title) => title.children[0].text.split(":")[1].trim());
}

async function gimmeTitles() {
  try {
    const response = await fetch(myURL);
    if (response.ok) {
      const data = await response.text();
      const dom = new JSDOM(data);
      const document = dom.window.document;

      const titles = Array.from(document.querySelectorAll(".teaser-title"));

      const listTitles = getAllTitles(titles);
      return listTitles;
    } else {
      console.log("Failed :(");
      return [];
    }
  } catch (err) {
    console.error(err);
    return [];
  }
}
///////////////////////////////////////////////////////
//download the video from that URL and it's name has white spaces replaced with _
async function downloadVideo(title, url) {
  const response = await fetch(url);
  if (response.ok) {
    await pipeline(
      response.body,
      fs.createWriteStream(`${title.replaceAll(" ", "_")}.mp4`),
    );
  }
}
//////////////////////////////////////////////////////
//
async function getDownloadURL(url) {
  const response = await fetch(url);

  if (response.ok) {
    const data = await response.json();
    const mediaStreamArray =
      data.widgets[0].mediaCollection.embedded._mediaArray[0]._mediaStreamArray;
    const sortedMediaStreamArray = mediaStreamArray
      .filter((stream) => stream._quality !== "auto")
      .sort((a, b) => b._quality - a._quality);
    const bestQuality = sortedMediaStreamArray.shift();
    const downloadURL = bestQuality._stream;
    console.log(downloadURL);
    return downloadURL;
  }
}

///////////////////////////////////////////////////////
async function searchVideo(title, url) {
  const response = await fetch(url);
  if (response.ok) {
    const data = await response.json();
    console.log(data.teasers);
    let found = data.teasers.find((teaser) =>
      teaser.longTitle.includes("klare Sprache"),
    );
    if (!found)
      found = data.teasers.find(
        (teaser) =>
          teaser.longTitle.includes(title) &&
          !teaser.longTitle.includes("Outtakes"),
      );
    return found.links.target.href;

    // if not exista....
  }
}
async function downloadSingleVideo(searchLink) {
  const [title, url] = searchLink;

  const videoPageURL = await searchVideo(title, url);
  const downloadURL = await getDownloadURL(videoPageURL);
  await downloadVideo(title, downloadURL);

  console.log(`Download completed! ${title}`);
}

async function downloadVideos() {
  const foundTitles = await gimmeTitles();
  const searchLinks = foundTitles.map((foundTitle) => [
    foundTitle,
    `https://api.ardmediathek.de/search-system/search/vods/ard?query=${foundTitle.replaceAll(" ", "+")}&pageNumber=0&pageSize=24&platform=MEDIA_THEK&sortingCriteria=SCORE_DESC`,
  ]);
  for (let i = 0; i < searchLinks.length; i++) {
    await downloadSingleVideo(searchLinks[i]);
  }
}

downloadVideos();
