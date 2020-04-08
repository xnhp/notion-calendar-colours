// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Modify_a_web_page

Zepto(function($) {

    console.log("calendar entry background colour userscript active");

    calEntriesSel = ".notion-calendar-view .notion-page-block a";
    // DOMSubtreeModified is quite a waste of calls because it triggers very often
    // during page assembly and on almost any hover in Notion
    // on click doesnt feel "automatic"
    // hover probably doesnt trigger as often but it still feels the most like an "automatic" update
    bodyHoverEvent = "mouseover";

    // check if some calendar has already loaded.
    // if, attach click handlers to all calendars available at this point
    // and deregister this handler.
    // note that this means that updating will probably only work for the first calendar in the page
    // to extend this, at this point we would have to look for not-completely-loaded calendars
    // or, keep re-attaching this handler (with potentially more targets)
    onBodyHover = function(e) {
        if (isACalLoaded()) {
            console.log("exchanging event handlers");
            // detach this wasteful event handler
            $("body").off(bodyHoverEvent, onBodyHover);
            // attach a more precise one where it matters
            // calEntriesSel is not sufficient: when new entries are added they dont have the handler
            $(".notion-calendar-view").on(
                // MutationObservers are not supported as it seems
                "DOMSubtreeModified",
                function(e) {
                    updateAllAvailEntries();
                });
        }

        updateAllAvailEntries();
    };
    // register on body because the calendar is added to the page asynchroneously
    // and not present at body ready
    $("body").on(bodyHoverEvent, onBodyHover);

    function updateAllAvailEntries() {
        // update colours for all currently present calendars
        $(calEntriesSel)
            .get() // get array from collection
            .forEach(function(elem,i,a) {
                updateEntryStyle(elem);
            });
    }

    function isACalLoaded() {
        return $('.notion-page-content')
            // cannot assume that entries are loaded when container is loaded
            .has(calEntriesSel)
            .length >= 1;
    }

    function updateEntryStyle(element) {
        applyBgCol(element,
                   findBgColOf(element)
                  );
        // hide tag display and set to minimal height
        findLastTagContainer(element).parent()
            .hide() // hide the tag display, returns self
            // we could additionally set the entries to auto height
            // however, the distance between entries will not change since
            // they are absolutely positioned
            // .closest(calEntriesSel) .css("height", "auto")
            // .closest(".notion-page-block").css("height", "auto")
        ;
    }

    function applyBgCol(targetElem, newCol) {
        $( targetElem ).css("background", newCol);
    }

    function findLastTagContainer(parentEl) {
        return $(parentEl)
        // some additional wrapper div that contains all contents
            .children("div").eq(0)
        // index 0 is headline, index 1 are property displays
            .children("div").eq(1)
        // these are the divs displaying the properties
        // order of property displays is dynamic (user-set).
            .children("div")
        // If an element has fewer properties set than the others, it will
        // contain empty divs where these properties would be displayed
        // notably, these empty divs are *the last* children.
        // assume that the tag we use for colouring is the last displayed property.
        // hence, we need to find the last div that has children
            .has("div")
            .last()
        // if this is a tag property display, there will be another container div
            .children("div");
    }

    function findBgColOf(elem) {
        // find the child to get the new background colour from
        lastTagDisplay = findLastTagContainer(elem);
            // "coincidentally", the element that contains the target bg colour is
        // also the one we want to modify

        lastTag = lastTagDisplay
        // in it, the resp. divs correspond directly to the contained tags.
            .children("div")
        // we use the last tag for colouring
            .last();

        return $(lastTag).css("background-color");
    }

});
