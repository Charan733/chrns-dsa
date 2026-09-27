/**
 * Validation Script for Ctrl + Alt + Career Problem Dataset
 */

const PROBLEMS = require('./js/data.js');

function validate() {
  const total = PROBLEMS.length;
  
  // Calculate difficulty breakdown
  let easy = 0, medium = 0, hard = 0;
  // Calculate platform breakdown
  const platforms = {};
  // Calculate source breakdown
  let sourceBoth = 0, sourceA2Z = 0, source60Days = 0;

  const idSet = new Set();
  const titleSet = new Set();
  let duplicateTitleCount = 0;
  let dummyCount = 0;

  PROBLEMS.forEach(p => {
    if (idSet.has(p.id)) {
      console.error(`ERROR: Duplicate ID found: ${p.id}`);
    }
    idSet.add(p.id);

    const normTitle = p.title.toLowerCase().trim();
    if (titleSet.has(normTitle)) {
      duplicateTitleCount++;
    }
    titleSet.add(normTitle);

    if (/Problem \d+/i.test(p.title) || /Dummy/i.test(p.title) || /Placeholder/i.test(p.title)) {
      dummyCount++;
    }

    if (p.difficulty === 'Easy') easy++;
    else if (p.difficulty === 'Hard') hard++;
    else medium++;

    const plat = p.platform || 'Other';
    platforms[plat] = (platforms[plat] || 0) + 1;

    if (p.source === 'Both') sourceBoth++;
    else if (p.source === 'Striver A2Z') sourceA2Z++;
    else if (p.source === '60DaysPractice') source60Days++;
  });

  const source1Count = source60Days + sourceBoth;
  const source2Count = sourceA2Z + sourceBoth;
  const duplicatesFound = sourceBoth;

  console.log(`============================================================`);
  console.log(`DATASET VALIDATION REPORT`);
  console.log(`============================================================`);
  console.log(`SOURCE 1 (60DaysPractice valid problems): ${source1Count}`);
  console.log(`SOURCE 2 (Striver A2Z problems): ${source2Count}`);
  console.log(`DUPLICATES FOUND: ${duplicatesFound}`);
  console.log(`FINAL UNIQUE PROBLEMS: ${total}`);
  console.log(`------------------------------------------------------------`);
  console.log(`DIFFICULTY BREAKDOWN:`);
  console.log(`Easy: ${easy} | Medium: ${medium} | Hard: ${hard}`);
  console.log(`------------------------------------------------------------`);
  console.log(`PLATFORM BREAKDOWN:`);
  Object.keys(platforms).sort().forEach(pl => {
    console.log(`${pl}: ${platforms[pl]}`);
  });
  console.log(`------------------------------------------------------------`);
  console.log(`INTEGRITY CHECKS:`);
  console.log(`Duplicate Title Cards: ${duplicateTitleCount}`);
  console.log(`Dummy / Placeholder Titles Found: ${dummyCount}`);
  console.log(`Unique IDs Count: ${idSet.size} / ${total}`);
  console.log(`============================================================`);

  if (dummyCount === 0 && idSet.size === total) {
    console.log(`VALIDATION STATUS: PASS`);
  } else {
    console.log(`VALIDATION STATUS: FAIL`);
  }
}

validate();
