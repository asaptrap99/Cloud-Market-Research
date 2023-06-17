
function articlesDraw(){

var likeCounts = {};
var commaFormat = d3.format("0,000");
var gotCounts = false;

var articles = [
  // {date:"08-01-2013",image:"shorty",top:"The Etymology of",url:"/shorty.html",type:"co",description:"",alt:""},
  // {date:"03-01-2014",image:"outkast",top:"",url:"/outkast.html",type:"co",description:"in Charts",alt:""},
  // {date:"12-01-2015",image:"camron",top:"Why",url:"/camron",type:"co",description:"is Peak Nostalgia",alt:""},
  // {date:"11-01-2015",image:"labels",top:"",url:"/labels",type:"co",description:"Sorted by the Success of Their Artists on Billboard",alt:""},
  // {date:"05-01-2014",image:"vocab",top:"Rappers, Sorted by the Size of their",url:"/vocabulary.html",type:"co",description:"",alt:""},
  // {date:"03-03-2016",image:"none",top:"When Music Becomes",url:"/billion",type:"co",description:"",alt:"Popular, Faster"},
  // {date:"04-10-2016",image:"comeback",top:"Using Historical NBA Data to Rank the Most Unlikely",url:"/nba",type:"cool",description:"",alt:""},
  {date:"04-09-2016",image:"dialogue",top:"",url:"/films",type:"cool",description:"for 2,000 Screenplays, Broken Down by Gender and Age",alt:""},
  {date:"01-09-2016",image:"punk",top:"Using Playlists to Crowdsource the Definition of",url:"/punk",type:"co",description:"",alt:""},
  {date:"01-21-2016",image:"hiphop",top:"This is What",url:"/billboard",type:"co",description:"Sounded Like, in 1995",alt:""},
  {date:"09-30-2015",image:"spotify",top:"Using",url:"/timeless",type:"co",description:"to Measure the Popularity of Older Music",alt:""},
  // {date:"01-15-2016",image:"bechdel",top:"The",url:"/bechdel",type:"cool",description:"Hollywood's Gender Divide and its Effects on Films",alt:""}
];

// d3.xml("svgs/bold.svg", "image/svg+xml", function(error, xml) {
//   if (error) throw error;
//   $(".logo").append(xml.documentElement);
// });

var container = d3.select(".related-articles");

var parseDate = d3.time.format("%m-%d-%Y").parse;
var niceParse = d3.time.format("%B %Y");

for (article in articles){
  articles[article].date_parsed = parseDate(articles[article].date);
}

articles = articles.sort(function(a,b) {return b.date_parsed-a.date_parsed;});

function makeRows(){
  var articleRows = container.selectAll(".article")
    .data(articles)
    .enter()
    .append("div")
    .attr("class","article")
    .style("visibility","hidden")
    ;

  articleRows.append("p")
    .attr("class","article-top tk-neuzeit-grotesk")
    .append("a")
    .attr("href",function(d){
      var prefix = "http://poly-graph.co";
      if(d.type == "cool"){
        prefix = "http://polygraph.cool"
      }
      return prefix+d.url;
    })
    .text(function(d,i){
      if (d.top == ""){
        return null;
      }
      return d.top;
    })
    ;

  articleRows
    .append("div")
    .attr("class","headline-container")
    .append("div")
    .attr("class","headline")
    .append("a")
    .attr("href",function(d){
      var prefix = "http://poly-graph.co";
      if(d.type == "cool"){
        prefix = "http://polygraph.cool"
      }
      return prefix+d.url;
    })
    .each(function(d,i){
      if(d.image != "none"){
        var item = $(this);
        d3.xml("svgs/"+d.image+".svg", "image/svg+xml", function(error, xml) {
          if (error) throw error;
          $(item).append(xml.documentElement);
          // $(this).append(xml.documentElement);
        });
      }
    })
    .filter(function(d,i){
      return d.image == "none";
    })
    .append("p")
    .attr("class","headline-alt tk-neuzeit-grotesk")
    .text(function(d,i){
      return d.alt;
    })
    ;

  var articleBelow = articleRows.append("div")
      .attr("class","article-below tk-neuzeit-grotesk")
      .style("margin-bottom",function(d){
        if(d.description != ""){
          return "20px";
        }
        return null;
      })
      .append("a")
      .attr("href",function(d){
        var prefix = "http://poly-graph.co";
        if(d.type == "cool"){
          prefix = "http://polygraph.cool"
        }
        return prefix+d.url;
      })
      .text(function(d,i){
        if (d.description == ""){
          return null;
        }
        return d.description;
      })
      ;

  var articleBottom = articleRows.append("div")
    .attr("class","article-bottom-container tk-neuzeit-grotesk");

  articleBottom.append("p")
    .attr("class","article-date tk-neuzeit-grotesk")
    .text(function(d,i){
      if(d.image == "vocab" || d.image == "outkast" || d.image == "shorty"){
        return "INTERNET OLD"
      }
      return niceParse(d.date_parsed);
    })
    ;

  articleBottom.append("p")
    .attr("class","article-stats tk-neuzeit-grotesk")
    .each(function(d,i){
      var element = d3.select(this);
      if(!gotCounts){
        var url = articles[article].url;
        var likeCount;
        var domain = "poly-graph.co";
        if(d.type == "cool"){
          domain = "polygraph.cool"
        }
        $.ajax({
          url: "https://api.facebook.com/method/links.getStats?urls=http://"+domain+d.url+"&format=json",
        })
        .success(function(data) {
          var url = "/" + data[0].url.slice(7).split("/")[1];
          likeCount = data[0].total_count;
          likeCounts[url] = likeCount;
          element.text(commaFormat(likeCount) + " Likes");
          if(!gotCounts){
            gotCounts = true;
          }
        })
      }else{
        element.text(commaFormat(d.total_count) + " Likes");
      }
    })
    ;

  articleRows
    .style("visibility","visible")
    .style("margin-top","20px")
    ;

}

makeRows();
}
articlesDraw();
