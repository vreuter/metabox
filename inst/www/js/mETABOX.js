//@src http://jsfiddle.net/motowilliams/7rL2C/
//@function convert json to tab-delimited format
function JSONToTabConvertor(JSONData,ShowHeader) {
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
    var CSV = '';    
        //This condition will generate the Label/Header
    if (ShowHeader) {
        var row = "";
        //This loop will extract the label from 1st index of on array
        for (var index in arrData[0]) {
            //Now convert each value to string and comma-seprated
            row += index.replace(/^name$/,"nodename") + '\t';
        }
        row = row.slice(0, -1);
        //append Label row with line break
        CSV += row + '\n';
    }
    //1st loop is to extract each row
    for (var i = 0; i < arrData.length; i++) {
        var row = "";
        //2nd loop will extract each column and convert it in string comma-seprated
        for (var index in arrData[i]) {
            row += arrData[i][index] + '\t';
        }
        row = row.slice(0, -1);
        //add a line break after each row
        CSV += row + '\n';
    }
    if (CSV == '') {        
        alert("Invalid data");
    }
    return CSV;
}

//@function load one column text file and pass to textarea
function loadTxtFile(event) {
  var input = event.target;
  var reader = new FileReader();
  reader.onload = function(){
    var text = reader.result;
    $("#txtinput").val("");//clear textarea
    $("#txtinput").val(text);//assign value to textarea
  };
  reader.readAsText(input.files[0]);
};

//@function export network outputs as a zip file
//@param nodes, edges array of json objects
//@param img cytoscapeJS png object
function exportNwZip(nodes, edges, img){
    var zip = new JSZip();
    zip.file("node.txt", JSONToTabConvertor(nodes,true))
    zip.file("edge.txt", JSONToTabConvertor(edges,true))
    zip.file("network.png", img.replace(/^data:image\/(png|jpg);base64,/, ""), {base64: true});
    zip.generateAsync({type:"base64"})
    .then(function (content) {
      var a = document.createElement('a'); 
      a.href="data:application/zip;base64,"+content;
      a.download = "OUTPUT.zip";
      a.click();
    });    
}

//@function export enrichment outputs as a zip file
//@param nodes, edges, enrichment array of json objects
//@param img cytoscapeJS png object
function exportEnrichmentZip(nodes, edges, enrichment, img){
    var zip = new JSZip();
    zip.file("node.txt", JSONToTabConvertor(nodes,true))
    zip.file("edge.txt", JSONToTabConvertor(edges,true))
    zip.file("enrichment.txt", JSONToTabConvertor(enrichment,true));
    zip.file("network.png", img.replace(/^data:image\/(png|jpg);base64,/, ""), {base64: true});
    zip.generateAsync({type:"base64"})
    .then(function (content) {
      var a = document.createElement('a'); 
      a.href="data:application/zip;base64,"+content;
      a.download = "OUTPUT.zip";
      a.click();
    });    
}

//@function export tab-delimited text file
//@param content array of json objects
function exportTxtFile(content){
    var a = document.createElement('a'); 
    a.href = "data:text/plain," + escape(JSONToTabConvertor(content,true));
    a.download = "OUTPUT.txt";
    a.click(); 
}

//@function format cytoscape json elements
//@param network cytoscape json elements
function formatCyJSON(network){
    var nodels = [];
    var edgels = [];
    Object.keys(network.elements.nodes).forEach(function(idx) {
        nodels.push(network.elements.nodes[idx].data);
    }); 
    Object.keys(network.elements.edges).forEach(function(idx) {
        edgels.push(network.elements.edges[idx].data);
    }); 
    return {'nodes':nodels,'edges':edgels};
}

//@function load spinner
function showSpinner(){
    $('#notifyBox').modal('show');
    var opts = {
      lines: 10, // The number of lines to draw
      length: 8, // The length of each line
      width: 10, // The line thickness
      radius: 20, // The radius of the inner circle
      corners: 1, // Corner roundness (0..1)
      rotate: 0, // The rotation offset
      direction: 1, // 1: clockwise, -1: counterclockwise
      color: '#0073b7', // #rgb or #rrggbb or array of colors
      speed: 1, // Rounds per second
      trail: 60, // Afterglow percentage
      shadow: false, // Whether to render a shadow
      hwaccel: false, // Whether to use hardware acceleration
      className: 'spinner', // The CSS class to assign to the spinner
      zIndex: 2e9, // The z-index (defaults to 2000000000)
      top: 'auto', // Top position relative to parent in px
      left:'auto' // Left position relative to parent in px
    };
    var spinner = new Spinner(opts).spin(document.getElementById('loading_spinner'));//assign spinner to modal box
    return spinner;
}

//@function hide spinner
function hideSpinner(spinner){
    spinner.stop();
    $('#notifyBox').modal('hide');
}

//@function get URL variables
//@param param, name of variable
//@based http://stackoverflow.com/questions/8460265/
function getURLVars(param)
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        if($.inArray(hash[0], vars)>-1)
        {
            vars[hash[0]]+=","+hash[1];
        }
        else
        {
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
    }
    var val = vars[param];
    if(val){val = val.replace(/\+/g, ' ');//replace whitespace
    }else{val = "";}
    return val;
}

//@function format table header
//@param jsonData json object
function formatTableHeader(jsonData){
    var keyls = Object.keys(jsonData);//get list of keys
    var colnames = [];
    for (var i = 0; i < keyls.length; i++) {//table header = json keys
      colnames.push({title: keyls[i], data: keyls[i]});
    }
    return colnames;
}

//@function draw table
//@param id id element
//@param data array of json objects
function drawTable(id, data) {
    var dtTable = $(id).DataTable({
      "destroy": true,
      "scrollX": true,
      "scrollY": 400,
      "scrollCollapse": true,
      "data": data,
      "columns": formatTableHeader(data[0])
    });
    return dtTable;
}

//@function format node for cytoscapeJS
//@param nodeArr array of json objects
function formatNode(nodeArr) {
    var nodels = [];
    for (var i = 0; i < nodeArr.length; i++) {//format list of nodes for cytoscapeJS
      nodels.push({
          data: nodeArr[i]
      });
    }
    return nodels;
}

//@function format node for cytoscapeJS
//@param nodeArr, enrichArr array of json objects
function formatPieNode(nodeArr, enrichArr) {
    var nodels = [];
    for (var i = 0; i < nodeArr.length; i++) {//format list of nodes for cytoscapeJS
      nodels.push({
          data: nodeArr[i]
      }); 
      Object.keys(enrichArr).forEach(function(idx) {
        if(enrichArr[idx].member.indexOf(nodeArr[i].id)!= -1){
            var pie = "pie" + enrichArr[idx].rank;
            nodels[i].data[pie] = 1; 
        }
      }); 
    }  
    return nodels;
}

//@function format edge for cytoscapeJS
//@param edgeArr array of json objects
function formatEdge(edgeArr) {
    var edgels = [];
    for (var i = 0; i < edgeArr.length; i++) {//format list of edges for cytoscapeJS
      edgels.push({
          data: edgeArr[i]
      });
    }
    return edgels;
}

//@function draw cytoscapeJS network
//@param objNode, objEdge array of json objects accepted by cytoscapeJS [{data:{id:'id',name:'name'}}]
function drawNetwork(objNode, objEdge){
    var cy = cytoscape({//initialize cytoscapeJS
      container: document.getElementById('cy'),
      boxSelectionEnabled: false,
      autounselectify: true,
      elements: {
        nodes: objNode,
        edges: objEdge
      },
      layout: {
        name: 'cose',
        padding: 10
      },
      style: cytoscape.stylesheet()
        .selector('node')
          .style({
            'content': 'data(nodename)',
            'background-color':'#B3B3B3',
            'text-valign': 'bottom',
            'color':'#515151',
            'text-outline-color':'#FFFFFF',
            'text-outline-width':0.3,
            'font-size':14,
            'pie-size': '90%',
            'pie-1-background-color': '#FF0000',
            'pie-1-background-size': 'mapData(pie1, 0, 10, 0, 100)',
            'pie-2-background-color': '#FFFFB3',
            'pie-2-background-size': 'mapData(pie2, 0, 10, 0, 100)',
            'pie-3-background-color': '#907FFF',
            'pie-3-background-size': 'mapData(pie3, 0, 10, 0, 100)',
            'pie-4-background-color': '#D56767',
            'pie-4-background-size': 'mapData(pie4, 0, 10, 0, 100)',
            'pie-5-background-color': '#54CCFF',
            'pie-5-background-size': 'mapData(pie5, 0, 10, 0, 100)',
            'pie-6-background-color': '#FDB462',
            'pie-6-background-size': 'mapData(pie6, 0, 10, 0, 100)',
            'pie-7-background-color': '#60DA3E',
            'pie-7-background-size': 'mapData(pie7, 0, 10, 0, 100)',
            'pie-8-background-color': '#F4B5D6',
            'pie-8-background-size': 'mapData(pie8, 0, 10, 0, 100)',
            'pie-9-background-color': '#FD49FF',
            'pie-9-background-size': 'mapData(pie9, 0, 10, 0, 100)',
            'pie-10-background-color': '#00715E',
            'pie-10-background-size': 'mapData(pie10, 0, 10, 0, 100)'
          })
        .selector('node[nodelabel = "Phenotype"]')
          .style({
            'shape':'octagon'
          })
        .selector('node[nodelabel = "Compound"]')
          .style({
            'shape':'ellipse'
          })
        .selector('node[nodelabel = "Dna"]')
          .style({
            'shape':'pentagon'
          })
        .selector('node[nodelabel = "Gene"]')
          .style({
            'shape':'hexagon'
          })
        .selector('node[nodelabel = "Pathway"]')
          .style({
            'shape':'diamond'
          })
        .selector('node[nodelabel = "Protein"]')
          .style({
            'shape':'rectangle'
          })
        .selector('node[nodelabel = "Rna"]')
          .style({
            'shape':'star'
          })
        .selector('edge')
          .style({
            'width': 3
          }) 
        .selector('edge[type = "ANNOTATION"]')
          .style({
            'line-color': '#8C8C8C',
            'target-arrow-color': '#8C8C8C'
          })
        .selector('edge[type = "BIOCHEMICAL_REACTION"]')
          .style({
            'line-color': '#ff0000',
            'target-arrow-color': '#ff0000'
          })
        .selector('edge[type = "CATALYSIS"]')
          .style({
            'line-color': '#4169E1',
            'target-arrow-color': '#4169E1'
          })
        .selector('edge[type = "CONTROL"]')
          .style({
            'line-color': '#006400',
            'target-arrow-color': '#006400'
          })
        .selector('edge[type = "CONVERSION"]')
          .style({
            'line-color': '#FF00FF',
            'target-arrow-color': '#FF00FF'
          })
        .selector('edge[type = "GENETIC_ASSOCIATION"]')
          .style({
            'line-color': '#00BFFF',
            'target-arrow-color': '#00BFFF'
          })
        .selector('edge[type = "MOLECULAR_BINDING"]')
          .style({
            'line-color': '#51ED34',
            'target-arrow-color': '#51ED34'
          })
        .selector('edge[type = "TANIMOTO_SIMILARITY"]')
          .style({
            'line-color': '#895238',
            'target-arrow-shape': 'none',
            'width': 'mapData(coef, 0, 1, 1, 10)'
          })
        .selector('edge[type = "CORRELATION"]')
          .style({
            'line-color': '#3f007d',
            'target-arrow-shape': 'none',
            'width': function(ele){
                var cf = Math.abs(ele.data('coef'));
                return cf * 10
            }
          })
        .selector('edge[type = "PARTIAL_CORRELATION"]')
          .style({
            'line-color': '#f16913',
            'target-arrow-shape': 'none',
            'width': function(ele){
                var cf = Math.abs(ele.data('coef'));
                return cf * 10
            }
          })
        .selector('edge[direction = -1]')
          .style({
            'line-style': 'dotted'
          })
        .selector(':selected')
          .style({
            'background-color': 'black',
            'line-color': 'black',
            'target-arrow-color': 'black',
            'source-arrow-color': 'black'
          })
        .selector('.faded')
          .style({
            'opacity': 0.25,
            'text-opacity': 0
          })
    });
    cy.on('tap', 'node', function(e){
      var node = e.cyTarget; 
      var neighborhood = node.neighborhood().add(node);
      cy.elements().addClass('faded');
      neighborhood.removeClass('faded');
    });
    cy.on('tap', function(e){
      if( e.cyTarget === cy ){
        cy.elements().removeClass('faded');
      }
    });
    return cy;
}