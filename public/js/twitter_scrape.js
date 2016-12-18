var positiveWords = [
		'excellent', 'amazing', 'happy', 'magnificent', ':)', 
		'wondeful', 'superb', 'great', 'perfect', 'love', 'positive'
	];
var negativeWords = [
		'unhappy', 'sorry', 'annoyed', 'dislike', 'anxious', ':(', 'fuck', 'hate', 
		'terrible', 'worst', 'bullshit', 'bad', 'crap', 'shit','negative'
	];

var scroller = document.getElementById('scroll_contents');

var positiveCount = 0;
var negativeCount = 0;

function processData(data) {
	try{
		if(data.place.country_code !== 'US') return;		// looking for US data only for this demo
	}catch(err){
		console.log("uhoh, no country code found.. ! ");
	}

	// Check if POSITIVE words are used in the tweet
	if (positiveWords.some(function(v) { return data.text.toLowerCase().indexOf(v) > 0; })) {
		positiveCount++;
		data.mood = "positive";
		if(data.text){
   			socket.send(JSON.stringify(data));
		}
	}
	// Check if NEGATIVE words are used in the tweet
	if (negativeWords.some(function(v) { return data.text.toLowerCase().indexOf(v) > 0; })) {
		negativeCount++;
		data.mood = "negative";
		if(data.text){
   			socket.send(JSON.stringify(data));
		}	
	}
	scroller.innerHTML = scroller.innerHTML + "<br />" + data.text;
}

var channel = 'pubnub-twitter';

// init pubnub api
var pubnub = PUBNUB.init({
	subscribe_key: 'sub-c-78806dd4-42a6-11e4-aed8-02ee2ddab7fe'
});

// subscribe to a stream
pubnub.subscribe({
	channel: channel,
	callback: processData
});
