const Twitter = require('twitter');
const config = require('./config.js');
const moment = require('moment');
const fs = require('fs');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const T = new Twitter(config);

const now = moment();
let params = {
  q: '#airbnb',
  result_type: 'recent',
  count: 100,
}
let tweetsArr = []

function checkIfTweetIsFromLast24HR(tweetTime) {
  return now.diff(moment(tweetTime), 'hours') < 24;
}

function getTweets(params) {
  return new Promise((resolve, reject) => {
    T.get('search/tweets', params, function(err, data, response) {
      resolve(data);
    })
  })
}

function exportToCsv(tweetsArr) {
  const csv = tweetsArr.map(function(d){
   return JSON.stringify(d);
   })
   .join('\n')
   .replace(/(^\[)|(\]$)/mg, '');
 fs.writeFile("./relevantTweets.csv", csv, function(err) {
     if(err) {
         return console.log('exporting Error: ',err);
     }

     console.log("The file was saved!");
 });
}

function getRelevantTweetsFromDataArray(data, tweetsArr) {
  for(let i = 0; i < data.statuses.length; i++){
    const currTweetCreatedAt = new Date(data.statuses[i].created_at)
    if(checkIfTweetIsFromLast24HR(currTweetCreatedAt)){
      tweetsArr.push(data.statuses[i])
    } else {
      return tweetsArr;
    }
  }
}

T.get('search/tweets', params, async(function(err, data, response) {
  if(!err){
    let lastTweetCreatedAt = new Date(data.statuses[data.statuses.length-1].created_at)
    // As long as the last tweet is within the last 24 hours, add all of the data to the tweetsArr
    while(checkIfTweetIsFromLast24HR(lastTweetCreatedAt)){
      tweetsArr = [...tweetsArr, ...data.statuses];
      params.max_id = data.statuses[data.statuses.length-1].id_str;
      data = await (getTweets(params));
      lastTweetCreatedAt = new Date(data.statuses[data.statuses.length-1].created_at)
    }
    // Check each tweet from last data, if it's within tha last 24hrs.
    tweetsArr = getRelevantTweetsFromDataArray(data, tweetsArr);
    exportToCsv(tweetsArr);
  } else {
    console.log('err:',err);
    }
}))
