// import D3
var debug = true;

var imported = document.createElement('script');
imported.src = 'd3.min.js';
document.head.appendChild(imported);


var maxWidth = Math.round(window.innerWidth * 0.95);
var maxHeight = Math.round(window.innerHeight * 0.95);

/**
    Returns random integer between min and max
 */
function randomInt(min, max) {
    return Math.floor((Math.random() * max) + min);
}

/**
    Calculates the intersection point of two lines
    result contains x,y as well as two flags. both flags must be true for the lines to intersect
 */
function checkLineIntersection(line1, line2) {
    var line1point1 = line1.p1;
    var line1point2 = line1.p2;
    var line2point1 = line2.p1;
    var line2point2 = line2.p2;
    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
    var denominator, a, b, numerator1, numerator2, result = {
        x: null,
        y: null,
        onLine1: false,
        onLine2: false
    };
    denominator = ((line2point2.y - line2point1.y) * (line1point2.x - line1point1.x)) - ((line2point2.x - line2point1.x) * (line1point2.y - line1point1.y));
    if (denominator == 0) {
        return result;
    }
    a = line1point1.y - line2point1.y;
    b = line1point1.x - line2point1.x;
    numerator1 = ((line2point2.x - line2point1.x) * a) - ((line2point2.y - line2point1.y) * b);
    numerator2 = ((line1point2.x - line1point1.x) * a) - ((line1point2.y - line1point1.y) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line1point1.x + (a * (line1point2.x - line1point1.x));
    result.y = line1point1.y + (a * (line1point2.y - line1point1.y));
/*
        // it is worth noting that this should be the same as:
        x = line2point1.x + (b * (line2point2.x - line2point1.x));
        y = line2point1.x + (b * (line2point2.y - line2point1.y));
*/
    // if line1 is a segment and line2 is infinite, they intersect if:
    if (a > 0 && a < 1) {
        result.onLine1 = true;
    }
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b > 0 && b < 1) {
        result.onLine2 = true;
    }
    // if line1 and line2 are segments, they intersect if both of the above are true
    return result;
}

function makeVerticalLine(x_coord, maxy) {
    return {p1: {x: x_coord, y: 0}, 
            p2: {x: x_coord, y: maxy}};
}

function makeHorizontalLine(maxx, y_coord) {
    return {p1: {x: 0, y: y_coord}, 
            p2: {x: maxx, y: y_coord}};
}

function pointToString(point) {
    return "(" + point.x + "," + point.y + ")";
}

function generateRandomPoint(limx, limy) {
    return {x: randomInt(0, limx), y: randomInt(0, limy)};
}

function getDistance(point1, point2) {
//     console.log("Distance of " + pointToString(point1) + " to " + pointToString(point2));
    return Math.sqrt( Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

/**
    Draws a rectangle of the desired size and fill shape
        rect contains an upper left and lower right x,y point defining its borders
 */
function drawRectangle(container, rect, color) {
    var xStart = rect.p1.x;
    var yStart = rect.p1.y;
    var width = Math.abs(rect.p2.x - xStart);
    var height = Math.abs(rect.p2.y - yStart);
    container.append("rect").attr("x", xStart).attr("y", yStart).attr("width", width).attr("height", height).attr("fill", color);
    if (debug) {
        var p_mid = {x: (rect.p1.x + rect.p2.x) / 2, y: (rect.p1.y + rect.p2.y) / 2};
        addText(container, p_mid, pointToString(rect.p1) + "|" + pointToString(rect.p2));
    }
}

/**
    Draws text
 */
function addText(container, pos, _text) {
    return container.append("text").attr("dx", pos.x).attr("dy", pos.y+10).text(_text);
}

function comparePoints(a, b) {
    if( a.x == b.x) return a.y-b.y;
    return a.x-b.x;
}

function makeMondrian(numPartitions, maxWidth, maxHeight, minRectSide) {
    var container = d3.select(".mondrian").append("svg").attr("width", maxWidth).attr("height", maxHeight);
    var drawnLines = [];
    var intersectionPoints = [{x:0,y:0}, {x:maxWidth,y:0}, {x:maxWidth,y:maxHeight}];    // list of all points where two lines intersect
    var line;

    // draw the border
    var upperLeft = {x: 0, y: 0};
    var lowerLeft = {x: 0, y: maxHeight};
    var upperRight = {x: maxWidth, y: 0};
    var lowerRight = {x: maxWidth, y: maxHeight};
    container = makeLine(container, upperLeft, upperRight, 4, "white");
    container = makeLine(container, upperLeft, lowerLeft, 4, "white");
    container = makeLine(container, lowerLeft, lowerRight, 4, "white");
    container = makeLine(container, upperRight, lowerRight, 4, "white");
    drawnLines.push({p1: upperLeft, p2: upperRight});
    drawnLines.push({p1: upperLeft, p2: lowerLeft});
    drawnLines.push({p1: lowerLeft, p2: lowerRight});
    drawnLines.push({p1: upperRight, p2: lowerRight});

    // make the partitions
    for (var i = 0; i < numPartitions; i ++ ) {
        // choose horizontal or vertical at random
        var repick = false;
        do {
            if (Math.random() > 0.5) {
                line = makeVerticalLine(randomInt(0, maxWidth), maxHeight);
            } else {
                line = makeHorizontalLine(maxWidth, randomInt(0, maxHeight));        
            }
            repick = false;
            // check that we're not going to make any tiny-ass rectangles
            intersectionPoints.forEach(function (p) {
                if (!repick) {
                    if (getDistance(p, line.p1) < minRectSide ||  getDistance(p, line.p2) < minRectSide) {
                        repick = true;
                    }
                }
            });
        } while (repick);
        for (var i = 0; i < drawnLines.length; i++) {
            var previous_line = drawnLines[i];
            var result = checkLineIntersection(previous_line, line);
            // does it intersect?
            if (result.onLine1 && result.onLine2) {
                result.x = Math.round(result.x);
                result.y = Math.round(result.y);
                // randomly pick an endpoint
                if (Math.random() > 0.5) {
                    line.p1 = {x: result.x, y: result.y};
                } else {
                    line.p2 = {x: result.x, y: result.y};
                }
            }
        }
        container = makeLine(container, line.p1, line.p2, 4, "black");
        drawnLines.push(line);
        intersectionPoints.push(line.p1);
        intersectionPoints.push(line.p2);
    }


    // sort intersectionPoints
    intersectionPoints.sort(comparePoints);

    // a rectangle shall be defined as a pair of points, upper-left and lower-right 
    var smallestRectangles = [];
    var ignorePoints = [];
    for (var i = 0; i < intersectionPoints.length; i++) {
        var possibleP1 = intersectionPoints[i];

        // check if already in smallestRectangles
        var contains = false;
        smallestRectangles.forEach(function (p) { if (p.p1 == possibleP1) contains = true; } );
        if (contains) {
            ignorePoints.push(possibleP1);
            continue;
        }

        // find next closest intersection point p such that possibleP1.y == p.y and possibleP1.x < p.x
        var candidatesP = [];
        intersectionPoints.forEach( function(p) {
            if (p.y == possibleP1.y && p.x > possibleP1.x) {
                // check if this is the "top" point in a line
                var isTopPoint = false;
                intersectionPoints.forEach( function(q) {
                    if (q.x == p.x) {
                        if (q.y > p.y) {
                            isTopPoint = true;
                        }
                    }
                });
                if (isTopPoint) {
                    candidatesP.push( p );
                }
            }
        });
        if (candidatesP.length == 0) {
            continue;
        }
        candidatesP.sort(function(a,b) {
            if (Math.abs(a.x - possibleP1.x) > Math.abs(b.x - possibleP1.x)) {
                return 1;
            } else {
                return -1;
            }
        });
        var _P = candidatesP[0];

        /*  from _P, find another point P2 such that:
                1. _P.x == P2.x
                2. P2 is not already the second point in any rectangle
                3. P2 is the right-most point on an existing line
                4. _P.y < P2.y
                5. P2 is the closest possible point to _P given conditions 1 through 4
         */
        var candidatesP2 = [];
        var done = false;
        // find all points below the possible midpoint
        intersectionPoints.forEach( function(p) {
            // point must be directly below me
            if (_P.x == p.x && _P.y < p.y) {
                candidatesP2.push(p);
            }
        });
        if (candidatesP2.length == 0) {
            console.log("No closing point corresponding to rectangle starting at " + pointToString(possibleP1) + ", with corner at " + pointToString(_P) + " (couldn't find points below)");
            continue;
        }
        // filter 
        var filteredCandidatesP2 = [];
        for (var k = 0; k < candidatesP2.length; k++) {
            var q = candidatesP2[k];
            intersectionPoints.forEach( function(p) {
                if (q.x > p.x && p.y == q.y) {
                    filteredCandidatesP2.push(q);
                }
            });
        }
//         candidatesP2 = filteredCandidatesP2;
        // sort
        candidatesP2.sort(function(a,b) {
            if (Math.abs(a.x - _P.x) > Math.abs(b.x - _P.x)) {
                return 1;
            } else {
                return -1;
            }
        });
        if (candidatesP2.length == 0) {
            console.log("No closing point corresponding to rectangle starting at " + pointToString(possibleP1) + ", with corner at " + pointToString(_P));
            continue;
        }
        if (debug) {
            var s = "";
            candidatesP2.forEach( function (p) {
                s += pointToString(p) + ", ";
            });
            console.log("Candidates for endpoint: " + s);
        }
        var endPoint = candidatesP2[0];
        console.log(pointToString(possibleP1) + " --> " + pointToString(_P) + " --> " + pointToString(endPoint));

        // okay, we found it
        var rect = {p1: possibleP1, p2: endPoint};
        smallestRectangles.push(rect);
    }

    // color up to 3 of the rectangles
    var colorChoices = ["red", "blue", "yellow"];
    for (var i = 0; i < smallestRectangles.length; i++) {
        var rect = smallestRectangles[i];
        if ( Math.random() > (1.0 - colorChoices.length / smallestRectangles.length ) ) {
            var avgPoint = {x: (rect.p1.x + rect.p2.x)/2, y: (rect.p2.y + rect.p1.y)/2};
            var color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
            drawRectangle(container, smallestRectangles[i], color);
            var index = colorChoices.indexOf(color);
            colorChoices.splice(index, 10);
        }
    }

    // redraw lines
    var i = 0;
    drawnLines.forEach( function (line) {
        if (i >= 4) {
            makeLine(container, line.p1, line.p2, 4, "black");
        }
        i++;
    });

    if (debug) {
        intersectionPoints.forEach( function (p) {
            container.append("circle").attr("cx", p.x).attr("cy", p.y).attr("r", 10);
            addText(container, p, pointToString(p));
        });
    }
}

function makeLine(lineContainer, point1, point2, width, color) {
    lineContainer.append("line").attr("x1", point1.x).attr("y1", point1.y).attr("x2", point2.x).attr("y2", point2.y)
                                .attr("stroke-width", width).attr("stroke", color);
    return lineContainer;
}

