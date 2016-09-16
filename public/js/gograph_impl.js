var mydiagram;
var myPalette;
function initGoDiagram(){
  if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
    var $ = go.GraphObject.make;  // for conciseness in defining templates

    myDiagram =
      $(go.Diagram, "myDiagramDiv",  // must name or refer to the DIV HTML element
        {
          initialContentAlignment: go.Spot.Center,
          allowZoom: true,
          "grid.visible": true,
          "clickCreatingTool.archetypeNodeData": { text: "Node" },
          "commandHandler.copiesTree": true,  // for the copy command
          "commandHandler.deletesTree": true, // for the delete command
          allowDrop: true,  // must be true to accept drops from the Palette
          "LinkDrawn": showLinkLabel,  // this DiagramEvent listener is defined below
          "LinkRelinked": showLinkLabel,
          "animationManager.duration": 800, // slightly longer than default (600ms) animation
          "undoManager.isEnabled": true , // enable undo & redo
          "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom
        });

    // when the document is modified, add a "*" to the title and enable the "Save" button
    myDiagram.addDiagramListener("Modified", function(e) {
      var button = document.getElementById("SaveBtn");
      if (button) button.disabled = !myDiagram.isModified;
      var idx = document.title.indexOf("*");
      if (myDiagram.isModified) {
        if (idx < 0) document.title += "*";
      } else {
        if (idx >= 0) document.title = document.title.substr(0, idx);
      }
    });

    // helper definitions for node templates

    function nodeStyle() {
      return [
        // The Node.location comes from the "loc" property of the node data,
        // converted by the Point.parse static method.
        // If the Node.location is changed, it updates the "loc" property of the node data,
        // converting back using the Point.stringify static method.
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        {
          // the Node.location is at the center of each node
          locationSpot: go.Spot.Center,
          //isShadowed: true,
          //shadowColor: "#888",
          // handle mouse enter/leave events to show/hide the ports
          mouseEnter: function (e, obj) { showPorts(obj.part, true); },
          mouseLeave: function (e, obj) { showPorts(obj.part, false); }
        }
      ];
    }

    // Define a function for creating a "port" that is normally transparent.
    // The "name" is used as the GraphObject.portId, the "spot" is used to control how links connect
    // and where the port is positioned on the node, and the boolean "output" and "input" arguments
    // control whether the user can draw links from or to the port.
    function makePort(name, spot, output, input) {
      // the port is basically just a small circle that has a white stroke when it is made visible
      return $(go.Shape, "Circle",
               {
                  fill: "transparent",
                  stroke: null,  // this is changed to "white" in the showPorts function
                  desiredSize: new go.Size(8, 8),
                  alignment: spot, alignmentFocus: spot,  // align the port on the main Shape
                  portId: name,  // declare this object to be a "port"
                  fromSpot: spot, toSpot: spot,  // declare where links may connect at this port
                  fromLinkable: output, toLinkable: input,  // declare whether the user may draw links to/from here
                  cursor: "pointer"  // show a different cursor to indicate potential link point
               });
    }

    // define the Node templates for regular nodes

    var lightText = 'whitesmoke';

    myDiagram.nodeTemplateMap.add("",  // the default category
      $(go.Node, "Spot", nodeStyle(),
        // the main object is a Panel that surrounds a TextBlock with a rectangular Shape
        $(go.Panel, "Auto",
          $(go.Shape, "Rectangle",
            { fill: "#00A9C9", stroke: null },
            new go.Binding("figure", "figure")),
          $(go.TextBlock,
            {
              font: "bold 11pt Helvetica, Arial, sans-serif",
              stroke: lightText,
              margin: 8,
              maxSize: new go.Size(160, NaN),
              wrap: go.TextBlock.WrapFit,
              editable: true
            },
            new go.Binding("text").makeTwoWay())
        ),
        // four named ports, one on each side:
        makePort("T", go.Spot.Top, false, true),
        makePort("L", go.Spot.Left, true, true),
        makePort("R", go.Spot.Right, true, true),
        makePort("B", go.Spot.Bottom, true, false)
      ));
    
    

    myDiagram.nodeTemplateMap.add("Start",
      $(go.Node, "Spot", nodeStyle(),
        $(go.Panel, "Auto",
          $(go.Shape, "Circle",
            { minSize: new go.Size(40, 40), fill: "#79C900", stroke: null }),
          $(go.TextBlock, "Start",
            { font: "bold 11pt Helvetica, Arial, sans-serif", stroke: lightText },
            new go.Binding("text"))
        ),
        // three named ports, one on each side except the top, all output only:
        makePort("L", go.Spot.Left, true, false),
        makePort("R", go.Spot.Right, true, false),
        makePort("B", go.Spot.Bottom, true, false)
      ));

    myDiagram.nodeTemplateMap.add("End",
      $(go.Node, "Spot", nodeStyle(),
        $(go.Panel, "Auto",
          $(go.Shape, "Circle",
            { minSize: new go.Size(40, 40), fill: "#DC3C00", stroke: null }),
          $(go.TextBlock, "End",
            { font: "bold 11pt Helvetica, Arial, sans-serif", stroke: lightText },
            new go.Binding("text"))
        ),
        // three named ports, one on each side except the bottom, all input only:
        makePort("T", go.Spot.Top, false, true),
        makePort("L", go.Spot.Left, false, true),
        makePort("R", go.Spot.Right, false, true)
      ));

    myDiagram.nodeTemplateMap.add("Comment",
      $(go.Node, "Auto", nodeStyle(),
        $(go.Shape, "File",
          { fill: "transparent", stroke: null }),
        $(go.TextBlock,
          {
            margin: 5,
            maxSize: new go.Size(200, NaN),
            wrap: go.TextBlock.WrapFit,
            textAlign: "center",
            editable: true,
            font: "bold 12pt Helvetica, Arial, sans-serif",
            stroke: '#454545'
          },
          new go.Binding("text").makeTwoWay()),
          makePort("T", go.Spot.Top, false, true),
          makePort("L", go.Spot.Left, true, true),
          makePort("R", go.Spot.Right, true, true),
          makePort("B", go.Spot.Bottom, true, false)
        // no ports, because no links are allowed to connect with a comment
      ));
    
    

    
    
    myDiagram.nodeTemplateMap.add("Model",
    	      $(go.Node, "Auto", nodeStyle(),
    	        $(go.Shape, "File",
    	          { fill: "GoldenRod", stroke: null }),
    	        $(go.TextBlock,
    	          {
    	            margin: 5,
    	            maxSize: new go.Size(200, NaN),
    	            wrap: go.TextBlock.WrapFit,
    	            textAlign: "center",
    	            editable: true,
    	            font: "bold 12pt Helvetica, Arial, sans-serif",
    	            stroke: '#454545'
    	          },
    	          new go.Binding("text").makeTwoWay()),
    	          makePort("T", go.Spot.Top, false, true),
    	          makePort("L", go.Spot.Left, true, true),
    	          makePort("R", go.Spot.Right, true, true),
    	          makePort("B", go.Spot.Bottom, true, false)
    	        // no ports, because no links are allowed to connect with a comment
    	      ));

    myDiagram.nodeTemplateMap.add('Action',
        $(go.Node, "Auto",
          // the outer shape for the node, surrounding the Table
          $(go.Shape, "Rectangle",
            { stroke: null, strokeWidth: 0 },
            /* reddish if highlighted, blue otherwise */
            new go.Binding("fill", "isHighlighted", function(h) { return h ? "#F44336" : "#F44336"; }).ofObject()),
          // a table to contain the different parts of the node
          $(go.Panel, "Table",
            { margin: 6, maxSize: new go.Size(200, NaN) },
            // the two TextBlocks in column 0 both stretch in width
            // but align on the left side
            $(go.RowColumnDefinition,
              {
                column: 0,
                stretch: go.GraphObject.Horizontal,
                alignment: go.Spot.Left
              }),
            // the name
            $(go.TextBlock,
              {
                row: 0, column: 0,
                maxSize: new go.Size(160, NaN), margin: 2,
                font: '500 16px Roboto, sans-serif',
                editable: true,
                alignment: go.Spot.Top
              },
              new go.Binding("text", "name")),

            // the additional textual information
            $(go.TextBlock,
              {
                row: 1, column: 0, columnSpan: 2,
                font: "12px Roboto, sans-serif",
                editable: true,
              },
              new go.Binding("text", "description"))
          ),  // end Table Panel
          makePort("T", go.Spot.Top, false, true),
    	          makePort("L", go.Spot.Left, true, true),
    	          makePort("R", go.Spot.Right, true, true),
    	          makePort("B", go.Spot.Bottom, true, false)
        )
        ); 

    // replace the default Link template in the linkTemplateMap
    myDiagram.linkTemplate =
      $(go.Link,  // the whole link panel
        {
          routing: go.Link.AvoidsNodes,
          curve: go.Link.JumpOver,
          corner: 5, toShortLength: 4,
          relinkableFrom: true,
          relinkableTo: true,
          reshapable: true,
          resegmentable: true,
          // mouse-overs subtly highlight links:
          mouseEnter: function(e, link) { link.findObject("HIGHLIGHT").stroke = "rgba(30,144,255,0.2)"; },
          mouseLeave: function(e, link) { link.findObject("HIGHLIGHT").stroke = "transparent"; }
        },
        new go.Binding("points").makeTwoWay(),
        $(go.Shape,  // the highlight shape, normally transparent
          { isPanelMain: true, strokeWidth: 8, stroke: "transparent", name: "HIGHLIGHT" }),
        $(go.Shape,  // the link path shape
          { isPanelMain: true, stroke: "gray", strokeWidth: 2 }),
        $(go.Shape,  // the arrowhead
          { toArrow: "standard", stroke: null, fill: "gray"}),
        $(go.Panel, "Auto",  // the link label, normally not visible
          { visible: false, name: "LABEL", segmentIndex: 2, segmentFraction: 0.5},
          new go.Binding("visible", "visible").makeTwoWay(),
          $(go.Shape, "RoundedRectangle",  // the label shape
            { fill: "#F8F8F8", stroke: null }),
          $(go.TextBlock, "Yes",  // the label
            {
              textAlign: "center",
              font: "10pt helvetica, arial, sans-serif",
              stroke: "#333333",
              editable: true
            },
            new go.Binding("text").makeTwoWay())
        )
      );

    // Make link labels visible if coming out of a "conditional" node.
    // This listener is called by the "LinkDrawn" and "LinkRelinked" DiagramEvents.
    function showLinkLabel(e) {
      var label = e.subject.findObject("LABEL");
      if (label !== null) label.visible = (e.subject.fromNode.data.figure === "Diamond");
    }

    // temporary links used by LinkingTool and RelinkingTool are also orthogonal:
    myDiagram.toolManager.linkingTool.temporaryLink.routing = go.Link.Orthogonal;
    myDiagram.toolManager.relinkingTool.temporaryLink.routing = go.Link.Orthogonal;

    //load();  // load an initial diagram from some JSON text
}

function initGoPalette(){
  if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
    var $ = go.GraphObject.make;  // for conciseness in defining templates
   myPalette =
      $(go.Palette, "myPaletteDiv",  // must name or refer to the DIV HTML element
        {
          maxSelectionCount: 1,
          nodeTemplateMap: myDiagram.nodeTemplateMap,  // share the templates used by myDiagram
          linkTemplate: // simplify the link template, just in this Palette
            $(go.Link,
              { // because the GridLayout.alignment is Location and the nodes have locationSpot == Spot.Center,
                // to line up the Link in the same manner we have to pretend the Link has the same location spot
                locationSpot: go.Spot.Center,
                selectionAdornmentTemplate:
                  $(go.Adornment, "Link",
                    { locationSpot: go.Spot.Center },
                    $(go.Shape,
                      { isPanelMain: true, fill: null, stroke: "deepskyblue", strokeWidth: 0 }),
                    $(go.Shape,  // the arrowhead
                      { toArrow: "Standard", stroke: null })
                  )
              },
              {
                routing: go.Link.AvoidsNodes,
                curve: go.Link.JumpOver,
                corner: 5,
                toShortLength: 4
              },
              new go.Binding("points"),
              $(go.Shape,  // the link path shape
                { isPanelMain: true, strokeWidth: 2 }),
              $(go.Shape,  // the arrowhead
                { toArrow: "Standard", stroke: null })
            ),
          model: new go.GraphLinksModel([  // specify the contents of the Palette
            {category: "Start", text: "Start", figure: "Circle", fill: "#00AD5F" },
            { text: "Activity/Step" },
            { text: "Actor", figure: "Parallelogram2", fill: "MediumOrchid" },
            { text: "Decision", figure: "Diamond", fill: "lightskyblue" },
  			{ category: "Model",text: "Model", figure: "TriangleRight", fill: "GoldenRod" },
  			{ text: "App/Code/Script", figure: "RoundedRectangle", fill: "DodgerBlue" },
  			{ text: "Product", figure: "Cube1", fill: "white" },
  			{ text: "Doc", figure: "File", fill: "lightgray" },
  			{ text: "Data", figure: "File", fill: "white" },
  			{ text: "DB", figure: "Database", fill: "lightgray" },
  			{ text: "WS", figure: "Circle", fill: "DodgerBlue" },
//  			{ text: "-    -", figure: "Resistor", fill: "white" },
  			{ category: "End",text: "End", figure: "Circle", fill: "#CE0620" },			
            { category: "Comment",text: "Comment",fill:"transparent" },
            { category: "Action",name: "Action",description:"This is an action",fill:"transparent" }
           ], [
            // the Palette also has a disconnected Link, which the user can drag-and-drop
//            { points: new go.List(go.Point).addAll([new go.Point(0, 0), new go.Point(30, 0), new go.Point(30, 40), new go.Point(60, 40)]), dash: [3,2] }
          ])
        });
};



    


  // Make all ports on a node visible when the mouse is over the node
  function showPorts(node, show) {
    var diagram = node.diagram;
    if (!diagram || diagram.isReadOnly || !diagram.allowLink) return;
    node.ports.each(function(port) {
        port.stroke = (show ? "white" : null);
      });
  }

  // function load() {
  //   myDiagram.model = go.Model.fromJson(document.getElementById("mySavedModel").value);
  // }

  // add an SVG rendering of the diagram at the end of this page
  function makeSVG() {
    var svg = myDiagram.makeSvg({
        scale: 0.5
      });
    svg.style.border = "1px solid black";
    obj = document.getElementById("SVGArea");
    obj.appendChild(svg);
    if (obj.children.length > 0) {
      obj.replaceChild(svg, obj.children[0]);
    }
  }
