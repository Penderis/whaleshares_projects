//https://rpc2.wls.services/
//https://wls.kennybll.com
//https://rpc3.wls.services/
//https://wls.kidw.space/

//Chain Options
steem.api.setOptions({
  url: "https://wls.kidw.space/"
});
steem.config.set("address_prefix", "WLS");
steem.config.set(
  "chain_id",
  "de999ada2ff7ed3d3d580381f229b40b5a0261aec48eb830e540080817b72866"
);

//## Get Global Properties for chain Async
let i = 1;
//this will store the accepted transactions
let build = [];
//hold table
let table;

//load data and such


function buildWalletTransaction(transaction) {
  if (transaction[1].op[0] === "account_create") {
    console.log("account created");
  }
  if (transaction[1].op[0] === "transfer") {
    //console.log("transactionFilter true", transaction);
    return true;
  } else {
    //console.log("transactionFilter false", transaction);
    return false;
  }
}

function structureTableColumns(walletArray) {
  console.log("Structuring Wallet");

  //Tabulator takes an array of objects - same for nested
  let tempWallet = [];

  for (counter = 0; counter < walletArray.length; counter++) {

    console.log("first fucking loop", counter);
    //temp holder to build out the next object in the tempWallet array
    let restructure = {}

    //console.log("main wallet counter: ", counter);

    //get index if object already exists in tempWallet
    let existingObjectIndex = null;

    if (tempWallet.length === 0) {

      console.log("temp fucking wallet is empty");
      //if the tempWallet has not been initialized yet add initial value to it.
      restructure.from = walletArray[counter][1].op[1].from;
      restructure.to = walletArray[counter][1].op[1].to;
      restructure.date = new Date(walletArray[counter][1].timestamp);
      //initiate sub array for secondary table
      restructure.transaction = [{
        amount: parseFloat(walletArray[counter][1].op[1].amount.replace(' WLS', '')),
        date: new Date(walletArray[counter][1].timestamp),
        memo: walletArray[counter][1].op[1].memo,
        chainIndex: walletArray[counter][0],
        block: walletArray[counter][1].block,
        trxID: walletArray[counter][1].trx_id,
      }]
      //push onto tempWallet as first index.
      tempWallet.push(restructure);

      console.log("Initialized Restructure: ", restructure);
      // console.log("Initialized Temp Wallet: ", tempWallet);

      //Exit out of loop and move on with the show
      console.log("exit main loop - initialize")

      continue;
    }

    //update object index
    for (internalCounter = 0; internalCounter < tempWallet.length; internalCounter++) {
      //console.log("Internal counter: ", internalCounter);
      // console.log("internal Counter wallet length", tempWallet.length);
      // console.log("internal wallet check: ", tempWallet[internalCounter]);
      if (tempWallet[internalCounter].from === walletArray[counter][1].op[1].from && tempWallet[internalCounter].to === walletArray[counter][1].op[1].to) {
        //then the object already exists and we append more transactions
        //console.log("Object Exists", internalCounter)
        existingObjectIndex = internalCounter;
      }

      //console.log("Internal Counter end ", internalCounter);
      //console.log("Existing object index inside loop: ", existingObjectIndex)
      // console.log("tempWallet internal counter", tempWallet);
    }


    //console.log("Existing object index: ", existingObjectIndex)

    //after counter
    if (existingObjectIndex === null) {
      //if it does not exist then create new entry
      //console.log("wallet array counter: ", walletArray[counter]);
      restructure.from = walletArray[counter][1].op[1].from;
      restructure.to = walletArray[counter][1].op[1].to;
      restructure.date = new Date(walletArray[counter][1].timestamp);
      //initiate sub array for secondary table
      restructure.transaction = [{
        amount: parseFloat(walletArray[counter][1].op[1].amount.replace(' WLS', '')),
        date: new Date(walletArray[counter][1].timestamp),
        memo: walletArray[counter][1].op[1].memo,
        chainIndex: walletArray[counter][0],
        block: walletArray[counter][1].block,
        trxID: walletArray[counter][1].trx_id,
      }]
      //push onto tempWallet as first index.
      console.log("existing is null? ", restructure);
      tempWallet.push(restructure);

    } else {
      //add transaction to existing transactions list for the user
      //check that date on parent array is the latest else replace
      let parentDate = tempWallet[existingObjectIndex].date;
      let childDate = new Date(walletArray[counter][1].timestamp);
      //console.log("Dates compare: ", parentDate, "second", childDate, parentDate < childDate);
      if (parentDate < childDate) {
        tempWallet[existingObjectIndex].date = childDate;
      }
      //push tranasaction onto child array for table
      tempWallet[existingObjectIndex].transaction.push({
        amount: parseFloat(walletArray[counter][1].op[1].amount.replace(' WLS', '')),
        date: new Date(walletArray[counter][1].timestamp),
        memo: walletArray[counter][1].op[1].memo,
        chainIndex: walletArray[counter][0],
        block: walletArray[counter][1].block,
        trxID: walletArray[counter][1].trx_id,
      })
    }

    //push restructure object onto temp wallet before exiting loops 

  }

  console.log("tempWallet Returned", tempWallet)
  return tempWallet;
}

async function getAccountHistoryAsync(accountName, start, limit) {
  console.log("fetching batch...", i++);
  console.log("Fetching batch", i, "Starting and limit", start, limit);
  return new Promise(function (resolve, reject) {

    steem.api.getAccountHistory(accountName, start, limit, function (err, result) {
      if (err) {
        console.log("api call rejected");
        reject(err);
      } else {
        console.log("api call resolved")
        //console.log(result);
        resolve(result)
      }
    });
  })
}

/*Not really sure this is a check that matters much since I now check for index 0*/
function checkForAccountCreation(accountName, awaitInfo) {
  //Check if we have hit account creation
  if (awaitInfo[0][1].op[0] === "account_create") {
    console.log("Account creation: ", awaitInfo[0][1]);
    //check that it is the account we are working withs creation
    if (awaitInfo[0][1].op[1].new_account_name === accountName) {
      //exit because we are at the beginning of time
      console.log("Singularity");
      //exit - make like a tree and fuck off.
      return true;
    }
  } else {
    //still good to go
    console.log("Account creation is still some ways off");
    return false;
  }
}

/*
   Now that we are somewhere tangible
   We will use the returned result and filter it for only
   wallet transfers. 
   Then structure for use in our table. 
 */
function checkDataValid(awaitInfo) {
  if (awaitInfo[0] !== undefined && awaitInfo.length > 0) {
    console.log("awaitInfo not undefined");
    //There might just be something to this
    return true;
  } else {
    //they gave us shit data
    console.log("awaitInfo is either undefined or fucking short");
    return false;
  }
}

async function getAllHistory(accountName, start, limit) {

  console.log("Start at first: ", start, "Limit at first: ", limit);

  //for fucksakes why does it go past this?
  if (start === 0 || start === undefined || start === isNaN(start)) {
    console.log("this should exit the first time?")

    return Promise.resolve("Start is non-existent what are you trying to pull?");;
  }

  //awaitInfo will store the promise return data
  let awaitInfo;

  /*
    if the api call exceeds limit then cut that shit out
    this gets updated from getAccountsHistoryAsync()
  */
  // if(i === 10){
  //   return Promise.resolve("All done");
  // }

  //ok starting this again
  /*
  if start is -1 we need to do a single call and 
  get the head chain index number, this is a stupid
  precaution for accounts smaller than the default start of 8500 transactions. 
      -- First call for free :)
  */
  if (start === -1) {
    //try the call to get head index number
    console.log("We are starting from: ", start);
    try {
      //Wait for the fucking result
      awaitInfo = await getAccountHistoryAsync(accountName, start, 1);

      //Get head index - result should only return a single item... 
      //Set new start equal to index      
      start = awaitInfo[awaitInfo.length - 1][0];
      console.log("Index to start from: ", start);

      //If there are not enough transaction to fit the limit
      if (limit >= start) {
        console.log("Limit is greater than start: ", limit);
        //set limit equal to start
        limit = start;
      }

    } catch (beginError) {
      //Log error - I really have no clue what could go wrong
      console.log("Try at -1 failed", beginError);
      console.log("Information Passed: Account, Start, Limit, Return Data", accountName, start, limit, awaitInfo)

      //I think according to fancy javascript rules I reject the promise?
      return Promise.reject("Something is wrong at -1 with current start: ", start, beginError);
    }
    //Finish off this monolith of an if statement and hopefully use our updated start and   limit in the next xhapter
  }

  /*
    If start - limit = 0, which would be the case with a
    new account with too few trasaction, set vars to continue 
    calling remainder transactions. 
  */
  if (start - limit === 0) {
    //Check. Get new data | Check Validity | Check if it is the end | filter data
    //-----for now I will do the steps then move it into a function---

    try {

      //Wait for the fucking result
      awaitInfo = await getAccountHistoryAsync(accountName, start, limit);
      console.log("Final Call index: ", start, limit);

    } catch (zeroError) {

      //Log error - I really have no clue what could go wrong
      console.log("Zero Limit error", beginError);
      console.log("Information Passed: Account, Start, Limit, Return Data", accountName, start, limit, awaitInfo)

      //I think according to fancy javascript rules I reject the promise?
      return Promise.reject("Something is wrong at start - limit: ", start, beginError);
    }

    /*
      if that is done and I think it is bullshit I need to keep doing that fucking      pattern, then we will do shit.
    */

    if (checkDataValid(awaitInfo)) {

      //awaitInfo has some shit we need let's use it
      let temp = awaitInfo.filter(buildWalletTransaction);
      console.log("awaitInfo after filter results: ", temp);

      //assign filtered data to global build which gets passed after all this shit is done
      build = build.concat(temp);
      //I think since this is the last call then we can resolve
      return Promise.resolve("start - limit is 0");

    } else {
      return Promise.resolve("awaitInfo is not valid 1")
    }
    //end another monolithic if statement 
    //-- If start - limit = 0 , surely that is it right?  
  }

  /*
    Adjust limit according to difference between start and limit on next iteration. This will keep reducing the closer it gets to 0
  */

  if (start <= limit) {
    console.log("Difference is less than limit: ", start, limit);

    //Adjust limit to equal the difference which will give us 0 next tick
    limit = start;
    // start = limit;

    console.log("Active start: ", start);
    console.log("New Limit:", limit);
  }

  /*
    The nitty gritty
      - Use adjusted starts and limits to call api
      - add more notes that make things seem smart
      - right now in the above call I adjust the limit and reject for -1 and 0 
        but have no check for for what start will be? 
      - I sincerely hope I did it correctly...
  */

  try {
    console.log("Global API call, counter, account, start, limit: ", i, accountName, start, limit)
    /*  
      This is where the loopy stuff happens and I sure as hell hope the start
      and limit adjustments are correct. FML.
    */
    awaitInfo = await getAccountHistoryAsync(accountName, start, limit);

    //A blatant copy of the above if
    if (checkDataValid(awaitInfo)) {

      //awaitInfo has some shit we need let's use it
      let temp = awaitInfo.filter(buildWalletTransaction);
      //console.log("awaitInfo after filter results in global: ", temp);

      //assign filtered data to global build which gets passed after all this shit is done
      build = build.concat(temp);

      //assign new start?

    } else {
      return Promise.resolve("awaitInfo is not valid 2")
    }

  } catch (globalError) {
    //log error and handle the end of the goddamn world.
    console.log("Global call error: ", globalError);
    return Promise.reject("global error", globalError);
  }

  //Surely after all that I have covered everything?
  console.log("What did I miss?");
  return getAllHistory(accountName, start - limit, limit);

}
//Begin table and vue 

Tabulator.prototype.extendModule("mutator", "mutators", {
  DateMutate: function (value, data, type, params, component) {
    //http://tabulator.info/docs/4.1/mutators
    //value - original value of the cell
    //data - the data for the row
    //type - the type of mutation occurring  (data|edit)
    //params - the mutatorParams object from the column definition
    //component - when the "type" argument is "edit", this contains the cell component for the edited cell, otherwise it is the column component for the column

    return moment(value); //return the new value for the cell data.
  },
});



let miniArray = [];

/*
Formats columns for table display
  - This is a nested column modelled after "transfers"
  - Main table contains From, To, Date
  - Sub-table is transaction data Amount, Date, Memo
  - extra transaction info include [ChainIndex, block, trxID]
*/
let columnsTest = [{
  title: "From",
  field: "from"
},
{
  title: "To",
  field: "to"
},
{
  title: "Date",
  field: "date",
  mutator: "DateMutate",
  sorter: "datetime",
  formatter: "datetime",
  formatterParams: {
    outputFormat: "DD-MMM-YY HH:mm:ss",
    invalidPlaceholder: "(invalid date)",
  }
}
];
let rowFormatter = function (row) {
  //create and style holder elements
  var holderEl = document.createElement("div");
  var tableEl = document.createElement("div");

  holderEl.style.boxSizing = "border-box";
  holderEl.style.padding = "10px 30px 10px 10px";
  holderEl.style.borderTop = "1px solid #333";
  holderEl.style.borderBotom = "1px solid #333";
  holderEl.style.background = "#ddd";

  tableEl.style.border = "1px solid #333";

  holderEl.appendChild(tableEl);

  row.getElement().appendChild(holderEl);

  var subTable = new Tabulator(tableEl, {
    layout: "fitColumns",
    data: row.getData().transaction,
    initialSort: [
      { column: "date", dir: "desc" }, //sort by this first
    ],
    columns: [{
      title: "Amount",
      field: "amount",
      formatter: "money",
      formatterParams: {"precision": 3},
      bottomCalc: "sum",
      bottomCalcParams: {
        precision: 3
      },
      width: 100
    },
    {
      title: "Date",
      field: "date",
      sorter: "datetime",
      dir: "asc",
      mutator: "DateMutate",
      formatter: "datetime",
      formatterParams: {
        outputFormat: "DD-MMM-YY HH:mm:ss",
        invalidPlaceholder: "(invalid date)",
      },
      width: 150
    },
    {
      title: "Memo",
      field: "memo",
      width: 250
    },
    {
      title: "Chain Index",
      field: "chainIndex",
      width: 50
    },
    {
      title: "Block",
      field: "block",
      width: 50
    },
    {
      title: "TRX ID",
      field: "trxID",
      width: 50
    },
    ]
  })
};

Vue.component('wallet-table', {
  props: ["walletColumns", "rowFormatting", "walletData"],
  data: function () {
    return {
      tabulator: null, //variable to hold your table
      tableData: [], //data for table to display
      dataLoaded: true,//show loader - 
    }
  },
  methods: {

    setUpdate: function (message) {
      this.updates = message;
    },
    setComponentData: function (data) {
      console.log("Setting Component Data");
      //this supposedly returns a promise.
      this.tabulator.replaceData(data)
        .then(result => {
          //this is always empty I don't think tabulator does shit
          console.log("component then: ", result);
          //set loader to not display
          this.dataLoaded = false;
          //Emit data loaded so parent can enable button
          this.$emit('table-is-loaded', false);
          //return true because we have to return something?
          return true;
        })
        .catch(err => {
          console.log("component error: ", err);
          return err;
        })
        ;
    }
  },
  watch:{
    //update table if data changes
    tableData:{
      handler: function (newData) {
        this.tabulator.replaceData(newData);
      },
      deep: true,
    }
  },
  mounted() {
    //console.log("wallet columns", this);
    //instantiate Tabulator when element is mounted
    this.tabulator = new Tabulator(this.$refs.table, {
      initialSort: [
        { column: "date", dir: "desc" }, //sort by date first
      ],
      data: this.tableData, //link data to table
      reactiveData: true, //enable data reactivity
      columns: this.walletColumns, //define table columns
      rowFormatter: this.rowFormatting,
      
    });
  },
  template: `<div>
                <div ref="table" v-bind:table-data="tableData"></div>
                <!--Loader-->
                <div class="loading-fucker" v-if="dataLoaded"> <div></div><div></div><div></div></div>
            </div>` //create table holder element
});



let userForm = new Vue({
  el: '#user-input',
  data: {
    accountName: '',
    dataBase: new PouchDB('transferWallet'),
    walletData: [],
    walletColumns: columnsTest,
    walletColumnFormatter: rowFormatter,
    docName: 'walletdata',
    enableFetch: false,
    doc: {}

  },
  mounted() {
    //set local DB name and data.
    //Might wanna check it is not an empty object? 
    if (this.walletData) {
      this.doc = {
        "_id": this.docName,
        "data": this.walletData
      };
      /* console.log(
        "dbName: ", this.docName,
        "doc: ", this.doc
      ) */
    }
  },
  computed: {
    // tempBlockButton: function () {
    //   return this.enableFetch;
    // },
    accountNameClean: function(){
      return this.accountName.toLowerCase();
    }
  },
  methods: {
    setWalletData: async function (data) {
      console.log("Before update", this.walletData, "the data: ", data);

      this.walletData = data;
      
      try {
        let component = this.$refs.fuckingwallet.setComponentData(data);
        console.log(component);
      } catch (err) {
        console.log("Could not update component", err);
      }
      
      console.log("after update", this.walletData)
    },

    toggleButtonFromChild: function(value){
      console.log("button reactivated");
      this.enableFetch = value;
      return true;
    },

    triggerButton: function (e) {
      e.preventDefault();
      console.log("You clicked the button");
      //disable that damn thing 
      this.enableFetch = true;
      //Responsible for retreiving and then updating document store. 
      /* 
        1. Check for local data
        2. If exist get last blockindex
        3. Check difference between current blockIndex against stored blockindex
           - this will actually never be the same since votes everything increase index
        4. fetch new data from stored blockindex point 
           - fixed limit for faster processing between calls
        5. update or create local store
        6. retrieve data from local store
        7. display transactions
        8. EVEN IF NO LOCAL STORE TRANSACTIONS SHOULD STILL BE ABLE TO BE DISPLAYED IN DOM
          - ponder this.
        
       */
      // this.dataBase.put(this.doc).then(function (err, result) {
      //   console.log("error", err);
      //   console.log("result", result)
      // }).catch(function (err) {
      //   console.log("There was an error with pouch: ", err);
      // });
      //First reset all globals
      i = 0;
      build = [];
      this.walletData = [];
      // //let table;
      getAllHistory(this.accountNameClean, -1, 8500)
        .then(getAllHistory())
        .then(function (result) {

          console.log("Structure the fucking wallet for the fucking table jesus fucking christ.")
          build = structureTableColumns(build);
          console.log("supposedly that has been fucking done you whore bleeding fuck face.")

          //define table
          console.log(" structured", build)
          try {
            console.log("We will try to set the data on this goddamn wannabe table")
            //send data to component
            userForm.setWalletData(build);
            // this.walletData = build;
            this.enableFetch = false;
          } catch (motherfuckingerror) {
            console.log("tabulator is fucked in the head.", motherfuckingerror);
          }
        }).catch(function (err) {
          //enable if something is wrong and we give up on life
          this.enableFetch = false;
          console.log("button should have been enabled");

          console.log("Something went wrong with fetching the data: ", err);

        });
    },
    dbInfo: function (e) {
      e.preventDefault();
      //displays info about current database
      //all values are currently hardcoded as we are only 
      //dealing with a single store
      this.dataBase.info().then(function (info) {
        console.log("database info: ", info);
      }).catch(function (dberr) {
        console.log("Failed to get DB info", dberr);
      })
    },
    createDB: function (e) {
      e.preventDefault();
      //If indexdb is cleared without page refresh the database 
      //won't exist and can be created again during runtime.
      this.dataBase = new PouchDB('transferWallet');
      console.log("Database Created", this.dataBase);
    },
    readData: function (e) {
      e.preventDefault();
      //Since I am storing the object as a whole this will fetch 
      //the entire database or go very fucking wrong.
      this.dataBase.get(this.docName).then(function (results) {
        console.log("DB Results: ", results);
      }).catch(function (err) {
        console.log("Could not get results for db: ", err);
      })
    },
    storeData: function (e) {
      e.preventDefault();

      console.log("Doc var: ", JSON.stringify(this.doc), "DOC name: ", this.dbName)
      /*
        for now will stringify the data to avoid issues but should use bulkdocs()
        for more features such as search and reduce
        https://pouchdb.com/api.html#batch_create
        - Accountants don't erase?
        - Let the store method delete old docs and only ever create a new doc.
        1. Process new data
        2. read old data
        3. append new data 
        4. destroy local store
        5. create new store with new data
      */
      this.dataBase.put({
        "_id": this.docName,
        "data": JSON.stringify(this.doc),
      }).then(function (err, result) {
        console.log("error with store", err);
        console.log("result for store", result)
      }).catch(function (err) {
        console.log("There was an error with storing: ", err);
      });

    },
  }
})






