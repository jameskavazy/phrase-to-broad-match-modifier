/*
    Settings

    For the script to function correctly, you must use consistent naming convention for all of your exact match campaigns so that it can differentiate them from the others.
*/
//----------------//
var dateRange = "LAST_14_DAYS"; // Choose from "YESTERDAY", "LAST_7_DAYS","LAST_14_DAYS", "LAST_30_DAYS"
var campaignNameFilter = "[P]"; //e.g. "My Campaign Name"
 //----------------//
/*
    Script starts below don't edit anything here
*/

function main() {
    addNegativeTerms();
}

 function addNegativeTerms(){

    const phraseMatchAdGroupIterator = getPhraseMatchAdGroups(campaignNameFilter);
    while (phraseMatchAdGroupIterator.hasNext()){
      const adGroup = phraseMatchAdGroupIterator.next();
      const adGroupId = adGroup.getId();


      const adGroupSearchQueries = getAdGroupSearchQueries(dateRange,adGroupId);


      const keywordIterator = getPhraseMatchKeywords(adGroupId);
      while (keywordIterator.hasNext()){
        const keywordObject = keywordIterator.next();
        if (keywordObject.isEnabled()){
          const keyword = keywordObject.getText();
          const wordsArr = keyword.split(" ");
          for (var i = 0; i < adGroupSearchQueries.length; i++){

            if (wordsArr.some(v => adGroupSearchQueries[i].includes(v))) {
                adGroupSearchQueries.splice(i,1);
                i--;
            }
          }
        }
      }

      for (var j = 0; j < adGroupSearchQueries.length; j++) {
        adGroup.createNegativeKeyword("[" + adGroupSearchQueries[j] + "]");
        console.log("Add negative keyword: " + adGroupSearchQueries[j]);
      }
    }
  }


/**
 *
 * @param {String} campaignNameFilter
 * @returns {Object} Ad Group Iterator
 */
function getPhraseMatchAdGroups(campaignNameFilter) {
    const escapedCampaignFilter = escapedFilter(campaignNameFilter);
    const adGroupIterator = AdsApp.adGroups()
        .withCondition('campaign.name LIKE "%' + escapedCampaignFilter + '%"')
        .get();

    return adGroupIterator;
  }

/**
 *
 * @param {Number} adGroupId
 * @returns {Object} Keyword Iterator
 */
  function getPhraseMatchKeywords(adGroupId){

    const keywordIterator = AdsApp.keywords()
        .withCondition(`ad_group.id = "${adGroupId}"`)
        .get();

    return keywordIterator;
  }


/**
 *
 * @param {String} dateRange
 * @param {Number} adGroupId
 * @returns {String[]} Phrase Match Ad Group Queries
 */
  function getAdGroupSearchQueries(dateRange, adGroupId) {
    const queryReport = AdsApp.report(
        "SELECT search_term_view.search_term, search_term_view.status \
        FROM search_term_view \
        WHERE ad_group.id = '" + adGroupId + "' AND segments.date DURING " + dateRange + " \
        AND search_term_view.status = 'NONE' "
        ).rows();    

    const queries = [];

    while (queryReport.hasNext()) {
        const row = queryReport.next();
        const query = row['search_term_view.search_term']
        queries.push(query);
    }
        return queries;
}
/**
 * 
 * @param {String} name 
 * @returns {String} escapedName
 */
function escapedFilter(name){
    return name.replace(/([\[\]%_\\])/g, "\[$1\]");
 }