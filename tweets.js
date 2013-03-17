provide("app/utils/twt", function(a) {
    using("//platform.twitter.com/js/vendor/twt/dist/twt.all.min.js", "css!//platform.twitter.com/twt/twt.css", function() {
        var b = window.twt;
        try {
            delete window.twt
        } catch (c) {
            window.twt = undefined
        }
        a(b)
    })
})
define("app/ui/dialogs/embed_tweet", ["module", "require", "exports", "core/component", "app/ui/with_position", "app/ui/with_dialog", "app/data/with_data", "app/data/with_scribe", "app/utils/twt"], function(module, require, exports) {
    function embedTweetDialog() {
        this.defaultAttrs({
            dialogSelector: "#embed-tweet-dialog",
            previewContainerSelector: ".embed-preview",
            triggerSelector: ".embed-link",
            tweetSelector: "div.tweet",
            targetTabSelector: ".embed-target li",
            alignmentTabContainerSelector: ".embed-alignment .input",
            alignmentTabSelector: ".embed-alignment label",
            embedCodeDestinationSelector: ".embed-destination",
            overlaySelector: ".embed-overlay",
            spinnerOverlaySelector: ".embed-overlay-spinner",
            errorOverlaySelector: ".embed-overlay-error",
            tryAgainSelector: ".embed-overlay-error a"
        }), this.cacheKeyForOptions = function(a) {
            return JSON.stringify(a)
        }, this.didReceiveEmbedCode = function(a, b) {
            var c = this.cacheKeyForOptions(a);
            this.cachedEmbedCodes[c] = b;
            if (c != this.cacheKeyForOptions(this.getOptions())) return;
            this.select("overlaySelector").hide();
            var d = a.target == "link" ? b.url : b.html;
            this.select("embedCodeDestinationSelector").val(d).focus()
        }, this.failedToReceiveEmbedCode = function(a, b) {
            this.scribe({
                component: "embed_tweet_dialog",
                action: "request_failed"
            });
            var c = this.cacheKeyForOptions(a);
            if (c != this.cacheKeyForOptions(this.getOptions())) return;
            this.select("overlaySelector").hide();
            if (b) {
                this.select("spinnerOverlaySelector").show();
                var d = this.didReceiveEmbedCode.bind(this, a),
                    e = this.failedToReceiveEmbedCode.bind(this, a, !1);
                this.requestEmbedCode(a, d, e)
            } else this.select("embedCodeDestinationSelector").hide(), this.select("errorOverlaySelector").show()
        }, this.requestEmbedCode = function(a, b, c) {
            var d = this.cacheKeyForOptions(a);
            if (this.cachedEmbedCodes[d]) {
                this.didReceiveEmbedCode(a, this.cachedEmbedCodes[d]);
                return
            }
            this.select("embedCodeDestinationSelector").val(""), this.get({
                url: this.embedCodeUrl,
                data: a,
                eventData: {},
                success: b,
                error: c
            })
        }, this.updateEmbedCode = function(a) {
            this.select("embedCodeDestinationSelector").show(), this.select("overlaySelector").hide();
            var b = this.getOptions(),
                c = this.didReceiveEmbedCode.bind(this, b),
                d = this.failedToReceiveEmbedCode.bind(this, b, !0);
            this.requestEmbedCode(b, c, d)
        }, this.getOptions = function() {
            return {
                lang: this.lang,
                target: this.select("targetTabSelector").find(".active").data("target"),
                align: this.select("alignmentTabContainerSelector").find("input:checked").val()
            }
        }, this.alignmentTabClicked = function(a) {
            this.select("alignmentTabContainerSelector").find(".active").removeClass("active"), this.$node.find(a.target).closest(this.attr.alignmentTabSelector).addClass("active"), setTimeout(this.updateEmbedCode.bind(this), 0)
        }, this.targetTabClicked = function(a) {
            this.select("targetTabSelector").find(".active").removeClass("active"), this.$node.find(a.target).addClass("active"), this.updateEmbedCode()
        }, this.renderTweet = function(a) {
            var b = a.tweet(this.statusData, {
                expandMedia: !0
            }),
                c;
            this.inReplyToStatusData ? c = b.inReplyTo(this.inReplyToStatusData).html() : c = b.html(), this.select("previewContainerSelector").html(c)
        }, this.embedOpen = function(a) {
            this.updateEmbedCode(), this.renderTweet(twt), a()
        }, this.after("initialize", function() {
            if (!this.attr.embedData) throw new Error("EmbedTweetDialog requires options to include 'embedData'");
            this.statusData = this.attr.embedData.status, this.inReplyToStatusData = this.attr.embedData.in_reply_to_status, this.embedCodeUrl = this.attr.embedData.embed_code_url, this.$dialog = this.select("dialogSelector"), this.$tweet = this.select("tweetSelector"), this.around("open", this.embedOpen), this.on("click", {
                alignmentTabSelector: this.alignmentTabClicked,
                targetTabSelector: this.targetTabClicked,
                tryAgainSelector: this.updateEmbedCode
            }), this.lang = document.documentElement.getAttribute("lang"), this.cachedEmbedCodes = {}
        })
    }
    var defineComponent = require("core/component"),
        withPosition = require("app/ui/with_position"),
        withDialog = require("app/ui/with_dialog"),
        withData = require("app/data/with_data"),
        withScribe = require("app/data/with_scribe"),
        twt = require("app/utils/twt"),
        EmbedTweetDialog = defineComponent(embedTweetDialog, withDialog, withPosition, withData, withScribe);
    module.exports = EmbedTweetDialog
});
define("app/data/tweet_actions", ["module", "require", "exports", "core/component", "core/utils", "app/data/with_data"], function(module, require, exports) {
    function tweetActions() {
        this.defaultAttrs({
            successFromEndpoints: {
                destroy: "dataDidDeleteTweet",
                retweet: "dataDidRetweet",
                favorite: "dataDidFavoriteTweet",
                unretweet: "dataDidUnretweet",
                unfavorite: "dataDidUnfavoriteTweet"
            },
            errorsFromEndpoints: {
                destroy: "dataFailedToDeleteTweet",
                retweet: "dataFailedToRetweet",
                favorite: "dataFailedToFavoriteTweet",
                unretweet: "dataFailedToUnretweet",
                unfavorite: "dataFailedToUnfavoriteTweet"
            }
        }), this.takeAction = function(a, b, c) {
            var d = function(b) {
                b && b.message && this.trigger("uiShowMessage", {
                    message: b.message
                }), this.trigger(this.attr.successFromEndpoints[a], b), this.trigger(document, "dataGotProfileStats", {
                    stats: b.profile_stats
                })
            }, e = {
                id: c.id
            };
            c.impressionId && (e.impression_id = c.impressionId, c.disclosureType && (e.earned = c.disclosureType == "earned"));
            var f = {
                destroy: "DELETE",
                unretweet: "DELETE"
            };
            this.JSONRequest({
                url: "/i/tweet/" + a,
                data: e,
                eventData: c,
                success: d.bind(this),
                error: this.attr.errorsFromEndpoints[a]
            }, f[a] || "POST")
        }, this.hitEndpoint = function(a) {
            return this.takeAction.bind(this, a)
        }, this.getTweet = function(a, b) {
            var c = {
                id: b.id
            };
            this.get({
                url: "/i/tweet/html",
                data: c,
                eventData: b,
                success: "dataGotTweet",
                error: $.noop
            })
        }, this.after("initialize", function() {
            this.on("uiDidRetweet", this.hitEndpoint("retweet")), this.on("uiDidUnretweet", this.hitEndpoint("unretweet")), this.on("uiDidDeleteTweet", this.hitEndpoint("destroy")), this.on("uiDidFavoriteTweet", this.hitEndpoint("favorite")), this.on("uiDidUnfavoriteTweet", this.hitEndpoint("unfavorite")), this.on("uiGetTweet", this.getTweet)
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        withData = require("app/data/with_data"),
        TweetActions = defineComponent(tweetActions, withData);
    module.exports = TweetActions
});
define("app/ui/expando/with_expanding_containers", ["module", "require", "exports"], function(module, require, exports) {
    function withExpandingContainers() {
        this.MARGIN_ANIMATION_SPEED = 85, this.DETACHED_MARGIN = 8, this.defaultAttrs({
            openClass: "open",
            openSelector: ".open",
            hoveredClass: "hovered-stream-item",
            hadHoveredClass: "js-had-hovered-stream-item",
            firstOpenItemSelector: ".js-stream-item:first.open",
            afterExpandedClass: "after-expanded",
            beforeExpandedClass: "before-expanded",
            marginBreaking: !0
        }), this.flipClassState = function(a, b, c) {
            a.filter("." + b).removeClass(b).addClass(c)
        }, this.fixMarginForAdjacentItem = function(a) {
            $(a.target).next().filter(this.attr.openSelector).css("margin-top", this.DETACHED_MARGIN).prev().addClass(this.attr.beforeExpandedClass)
        }, this.enterDetachedState = function(a, b) {
            var c = a.prev(),
                d = a.next();
            a.addClass(this.attr.openClass), this.attr.marginBreaking && a.animate({
                marginTop: c.length ? this.DETACHED_MARGIN : 0,
                marginBottom: d.length ? this.DETACHED_MARGIN : 0
            }, {
                duration: b ? 0 : this.MARGIN_ANIMATION_SPEED
            }), c.addClass(this.attr.beforeExpandedClass), d.addClass(this.attr.afterExpandedClass), this.flipClassState(a, this.attr.hoveredClass, this.attr.hadHoveredClass)
        }, this.exitDetachedState = function(a, b) {
            var c = function() {
                this.flipClassState(a, this.attr.hadHoveredClass, this.attr.hoveredClass), a.prev().removeClass(this.attr.beforeExpandedClass).end().next().removeClass(this.attr.afterExpandedClass)
            }.bind(this);
            a.removeClass(this.attr.openClass), this.attr.marginBreaking ? a.animate({
                marginTop: 0,
                marginBottom: 0
            }, {
                duration: b ? 0 : this.MARGIN_ANIMATION_SPEED,
                complete: c
            }) : c()
        }, this.after("initialize", function() {
            this.on("uiHasInjectedTimelineItem uiShouldFixMargins", this.fixMarginForAdjacentItem)
        })
    }
    module.exports = withExpandingContainers
});
define("app/ui/expando/expando_helpers", ["module", "require", "exports"], function(module, require, exports) {
    var SPEED_COEFFICIENT = 105,
        expandoHelpers = {
            buildExpandoStruct: function(a) {
                var b = a.$tweet,
                    c = b.hasClass(a.originalClass),
                    d = a.preexpanded,
                    e = c ? b.closest(a.containingSelector) : b,
                    f = b.closest(a.expansionSelector).get(0),
                    g = f ? $(f) : $(),
                    h = {
                        $tweet: b,
                        $container: e,
                        $scaffold: g,
                        $ancestors: e.find(a.inReplyToSelector),
                        $descendants: e.find(a.repliesSelector),
                        auto_expanded: b.hasClass("auto-expanded"),
                        isTopLevel: c,
                        conversationLoaded: !1,
                        originalHeight: null,
                        animating: !1,
                        preexpanded: d,
                        open: b.hasClass(a.openedTweetClass) && !d
                    };
                return h
            },
            guessGoodSpeed: function() {
                var a = Math.max.apply(Math, arguments);
                return Math.round(.35 * Math.log(a) * SPEED_COEFFICIENT)
            },
            getNaturalHeight: function(a) {
                var b = a.height(),
                    c = a.height("auto").height();
                return a.height(b), c
            },
            closeAllButPreserveScroll: function(a) {
                var b = a.$scope.find(a.openSelector);
                if (!b.length) return !1;
                var c = $(window).scrollTop(),
                    d = expandoHelpers.firstVisibleItemBelow(a.$scope, a.itemSelector, c);
                if (!d || !d.length) return !1;
                var e = d.offset().top;
                b.each(a.callback);
                var f = d.offset().top,
                    g = e - f;
                return $(window).scrollTop(c - g), g
            },
            firstVisibleItemBelow: function(a, b, c) {
                var d;
                return a.find(b).each(function() {
                    var a = $(this);
                    if (a.offset().top >= c) return d = a, !1
                }), d
            }
        };
    module.exports = expandoHelpers
});
/*! twitter-text-js 1.5.2 (c) 2012 Twitter, Inc. http://www.apache.org/licenses/LICENSE-2.0 */
provide("lib/twitter-text", function(a) {
    var b = {};
    (function() {
        function c(a, c) {
            return c = c || "", typeof a != "string" && (a.global && c.indexOf("g") < 0 && (c += "g"), a.ignoreCase && c.indexOf("i") < 0 && (c += "i"), a.multiline && c.indexOf("m") < 0 && (c += "m"), a = a.source), new RegExp(a.replace(/#\{(\w+)\}/g, function(a, c) {
                var d = b.txt.regexen[c] || "";
                return typeof d != "string" && (d = d.source), d
            }), c)
        }
        function d(a, b) {
            return a.replace(/#\{(\w+)\}/g, function(a, c) {
                return b[c] || ""
            })
        }
        function e(a, b, c) {
            var d = String.fromCharCode(b);
            return c !== b && (d += "-" + String.fromCharCode(c)), a.push(d), a
        }
        function q(a) {
            var b = {};
            for (var c in a) a.hasOwnProperty(c) && (b[c] = a[c]);
            return b
        }
        function u(a, b, c) {
            return c ? !a || a.match(b) && RegExp["$&"] === a : typeof a == "string" && a.match(b) && RegExp["$&"] === a
        }
        b.txt = {}, b.txt.regexen = {};
        var a = {
            "&": "&amp;",
            ">": "&gt;",
            "<": "&lt;",
            '"': "&quot;",
            "'": "&#39;"
        };
        b.txt.htmlEscape = function(b) {
            return b && b.replace(/[&"'><]/g, function(b) {
                return a[b]
            })
        }, b.txt.regexSupplant = c, b.txt.stringSupplant = d, b.txt.addCharsToCharClass = e;
        var f = String.fromCharCode,
            g = [f(32), f(133), f(160), f(5760), f(6158), f(8232), f(8233), f(8239), f(8287), f(12288)];
        e(g, 9, 13), e(g, 8192, 8202);
        var h = [f(65534), f(65279), f(65535)];
        e(h, 8234, 8238), b.txt.regexen.spaces_group = c(g.join("")), b.txt.regexen.spaces = c("[" + g.join("") + "]"), b.txt.regexen.invalid_chars_group = c(h.join("")), b.txt.regexen.punct = /\!'#%&'\(\)*\+,\\\-\.\/:;<=>\?@\[\]\^_{|}~\$/, b.txt.regexen.rtl_chars = /[\u0600-\u06FF]|[\u0750-\u077F]|[\u0590-\u05FF]|[\uFE70-\uFEFF]/gm, b.txt.regexen.non_bmp_code_pairs = /[\uD800-\uDBFF][\uDC00-\uDFFF]/gm;
        var i = [];
        e(i, 1024, 1279), e(i, 1280, 1319), e(i, 11744, 11775), e(i, 42560, 42655), e(i, 1425, 1471), e(i, 1473, 1474), e(i, 1476, 1477), e(i, 1479, 1479), e(i, 1488, 1514), e(i, 1520, 1524), e(i, 64274, 64296), e(i, 64298, 64310), e(i, 64312, 64316), e(i, 64318, 64318), e(i, 64320, 64321), e(i, 64323, 64324), e(i, 64326, 64335), e(i, 1552, 1562), e(i, 1568, 1631), e(i, 1646, 1747), e(i, 1749, 1756), e(i, 1758, 1768), e(i, 1770, 1775), e(i, 1786, 1788), e(i, 1791, 1791), e(i, 1872, 1919), e(i, 2208, 2208), e(i, 2210, 2220), e(i, 2276, 2302), e(i, 64336, 64433), e(i, 64467, 64829), e(i, 64848, 64911), e(i, 64914, 64967), e(i, 65008, 65019), e(i, 65136, 65140), e(i, 65142, 65276), e(i, 8204, 8204), e(i, 3585, 3642), e(i, 3648, 3662), e(i, 4352, 4607), e(i, 12592, 12677), e(i, 43360, 43391), e(i, 44032, 55215), e(i, 55216, 55295), e(i, 65441, 65500), e(i, 12449, 12538), e(i, 12540, 12542), e(i, 65382, 65439), e(i, 65392, 65392), e(i, 65296, 65305), e(i, 65313, 65338), e(i, 65345, 65370), e(i, 12353, 12438), e(i, 12441, 12446), e(i, 13312, 19903), e(i, 19968, 40959), e(i, 173824, 177983), e(i, 177984, 178207), e(i, 194560, 195103), e(i, 12291, 12291), e(i, 12293, 12293), e(i, 12347, 12347), b.txt.regexen.nonLatinHashtagChars = c(i.join(""));
        var j = [];
        e(j, 192, 214), e(j, 216, 246), e(j, 248, 255), e(j, 256, 591), e(j, 595, 596), e(j, 598, 599), e(j, 601, 601), e(j, 603, 603), e(j, 611, 611), e(j, 616, 616), e(j, 623, 623), e(j, 626, 626), e(j, 649, 649), e(j, 651, 651), e(j, 699, 699), e(j, 768, 879), e(j, 7680, 7935), b.txt.regexen.latinAccentChars = c(j.join("")), b.txt.regexen.hashSigns = /[#ï¼ƒ]/, b.txt.regexen.hashtagAlpha = c(/[a-z_#{latinAccentChars}#{nonLatinHashtagChars}]/i), b.txt.regexen.hashtagAlphaNumeric = c(/[a-z0-9_#{latinAccentChars}#{nonLatinHashtagChars}]/i), b.txt.regexen.endHashtagMatch = c(/^(?:#{hashSigns}|:\/\/)/), b.txt.regexen.hashtagBoundary = c(/(?:^|$|[^&a-z0-9_#{latinAccentChars}#{nonLatinHashtagChars}])/), b.txt.regexen.validHashtag = c(/(#{hashtagBoundary})(#{hashSigns})(#{hashtagAlphaNumeric}*#{hashtagAlpha}#{hashtagAlphaNumeric}*)/gi), b.txt.regexen.validMentionPrecedingChars = /(?:^|[^a-zA-Z0-9_!#$%&*@ï¼ ]|RT:?)/, b.txt.regexen.atSigns = /[@ï¼ ]/, b.txt.regexen.validMentionOrList = c("(#{validMentionPrecedingChars})(#{atSigns})([a-zA-Z0-9_]{1,20})(/[a-zA-Z][a-zA-Z0-9_-]{0,24})?", "g"), b.txt.regexen.validReply = c(/^(?:#{spaces})*#{atSigns}([a-zA-Z0-9_]{1,20})/), b.txt.regexen.endMentionMatch = c(/^(?:#{atSigns}|[#{latinAccentChars}]|:\/\/)/), b.txt.regexen.validUrlPrecedingChars = c(/(?:[^A-Za-z0-9@ï¼ $#ï¼ƒ#{invalid_chars_group}]|^)/), b.txt.regexen.invalidUrlWithoutProtocolPrecedingChars = /[-_.\/]$/, b.txt.regexen.invalidDomainChars = d("#{punct}#{spaces_group}#{invalid_chars_group}", b.txt.regexen), b.txt.regexen.validDomainChars = c(/[^#{invalidDomainChars}]/), b.txt.regexen.validSubdomain = c(/(?:(?:#{validDomainChars}(?:[_-]|#{validDomainChars})*)?#{validDomainChars}\.)/), b.txt.regexen.validDomainName = c(/(?:(?:#{validDomainChars}(?:-|#{validDomainChars})*)?#{validDomainChars}\.)/), b.txt.regexen.validGTLD = c(/(?:(?:aero|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|xxx)(?=[^0-9a-zA-Z]|$))/), b.txt.regexen.validCCTLD = c(/(?:(?:ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cs|cu|cv|cx|cy|cz|dd|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|ss|st|su|sv|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|za|zm|zw)(?=[^0-9a-zA-Z]|$))/), b.txt.regexen.validPunycode = c(/(?:xn--[0-9a-z]+)/), b.txt.regexen.validDomain = c(/(?:#{validSubdomain}*#{validDomainName}(?:#{validGTLD}|#{validCCTLD}|#{validPunycode}))/), b.txt.regexen.validAsciiDomain = c(/(?:(?:[a-z0-9#{latinAccentChars}]+)\.)+(?:#{validGTLD}|#{validCCTLD}|#{validPunycode})/gi), b.txt.regexen.invalidShortDomain = c(/^#{validDomainName}#{validCCTLD}$/), b.txt.regexen.validPortNumber = c(/[0-9]+/), b.txt.regexen.validGeneralUrlPathChars = c(/[a-z0-9!\*';:=\+,\.\$\/%#\[\]\-_~|&#{latinAccentChars}]/i), b.txt.regexen.validUrlBalancedParens = c(/\(#{validGeneralUrlPathChars}+\)/i), b.txt.regexen.validUrlPathEndingChars = c(/[\+\-a-z0-9=_#\/#{latinAccentChars}]|(?:#{validUrlBalancedParens})/i), b.txt.regexen.validUrlPath = c("(?:(?:#{validGeneralUrlPathChars}*(?:#{validUrlBalancedParens}#{validGeneralUrlPathChars}*)*#{validUrlPathEndingChars})|(?:@#{validGeneralUrlPathChars}+/))", "i"), b.txt.regexen.validUrlQueryChars = /[a-z0-9!?\*'\(\);:&=\+\$\/%#\[\]\-_\.,~|]/i, b.txt.regexen.validUrlQueryEndingChars = /[a-z0-9_&=#\/]/i, b.txt.regexen.extractUrl = c("((#{validUrlPrecedingChars})((https?:\\/\\/)?(#{validDomain})(?::(#{validPortNumber}))?(\\/#{validUrlPath}*)?(\\?#{validUrlQueryChars}*#{validUrlQueryEndingChars})?))", "gi"), b.txt.regexen.validTcoUrl = /^https?:\/\/t\.co\/[a-z0-9]+/i, b.txt.regexen.cashtag = /[a-z]{1,6}(?:[._][a-z]{1,2})?/i, b.txt.regexen.validCashtag = c("(^|#{spaces})(\\$)(#{cashtag})(?=$|\\s|[#{punct}])", "gi"), b.txt.regexen.validateUrlUnreserved = /[a-z0-9\-._~]/i, b.txt.regexen.validateUrlPctEncoded = /(?:%[0-9a-f]{2})/i, b.txt.regexen.validateUrlSubDelims = /[!$&'()*+,;=]/i, b.txt.regexen.validateUrlPchar = c("(?:#{validateUrlUnreserved}|#{validateUrlPctEncoded}|#{validateUrlSubDelims}|[:|@])", "i"), b.txt.regexen.validateUrlScheme = /(?:[a-z][a-z0-9+\-.]*)/i, b.txt.regexen.validateUrlUserinfo = c("(?:#{validateUrlUnreserved}|#{validateUrlPctEncoded}|#{validateUrlSubDelims}|:)*", "i"), b.txt.regexen.validateUrlDecOctet = /(?:[0-9]|(?:[1-9][0-9])|(?:1[0-9]{2})|(?:2[0-4][0-9])|(?:25[0-5]))/i, b.txt.regexen.validateUrlIpv4 = c(/(?:#{validateUrlDecOctet}(?:\.#{validateUrlDecOctet}){3})/i), b.txt.regexen.validateUrlIpv6 = /(?:\[[a-f0-9:\.]+\])/i, b.txt.regexen.validateUrlIp = c("(?:#{validateUrlIpv4}|#{validateUrlIpv6})", "i"), b.txt.regexen.validateUrlSubDomainSegment = /(?:[a-z0-9](?:[a-z0-9_\-]*[a-z0-9])?)/i, b.txt.regexen.validateUrlDomainSegment = /(?:[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?)/i, b.txt.regexen.validateUrlDomainTld = /(?:[a-z](?:[a-z0-9\-]*[a-z0-9])?)/i, b.txt.regexen.validateUrlDomain = c(/(?:(?:#{validateUrlSubDomainSegment]}\.)*(?:#{validateUrlDomainSegment]}\.)#{validateUrlDomainTld})/i), b.txt.regexen.validateUrlHost = c("(?:#{validateUrlIp}|#{validateUrlDomain})", "i"), b.txt.regexen.validateUrlUnicodeSubDomainSegment = /(?:(?:[a-z0-9]|[^\u0000-\u007f])(?:(?:[a-z0-9_\-]|[^\u0000-\u007f])*(?:[a-z0-9]|[^\u0000-\u007f]))?)/i, b.txt.regexen.validateUrlUnicodeDomainSegment = /(?:(?:[a-z0-9]|[^\u0000-\u007f])(?:(?:[a-z0-9\-]|[^\u0000-\u007f])*(?:[a-z0-9]|[^\u0000-\u007f]))?)/i, b.txt.regexen.validateUrlUnicodeDomainTld = /(?:(?:[a-z]|[^\u0000-\u007f])(?:(?:[a-z0-9\-]|[^\u0000-\u007f])*(?:[a-z0-9]|[^\u0000-\u007f]))?)/i, b.txt.regexen.validateUrlUnicodeDomain = c(/(?:(?:#{validateUrlUnicodeSubDomainSegment}\.)*(?:#{validateUrlUnicodeDomainSegment}\.)#{validateUrlUnicodeDomainTld})/i), b.txt.regexen.validateUrlUnicodeHost = c("(?:#{validateUrlIp}|#{validateUrlUnicodeDomain})", "i"), b.txt.regexen.validateUrlPort = /[0-9]{1,5}/, b.txt.regexen.validateUrlUnicodeAuthority = c("(?:(#{validateUrlUserinfo})@)?(#{validateUrlUnicodeHost})(?::(#{validateUrlPort}))?", "i"), b.txt.regexen.validateUrlAuthority = c("(?:(#{validateUrlUserinfo})@)?(#{validateUrlHost})(?::(#{validateUrlPort}))?", "i"), b.txt.regexen.validateUrlPath = c(/(\/#{validateUrlPchar}*)*/i), b.txt.regexen.validateUrlQuery = c(/(#{validateUrlPchar}|\/|\?)*/i), b.txt.regexen.validateUrlFragment = c(/(#{validateUrlPchar}|\/|\?)*/i), b.txt.regexen.validateUrlUnencoded = c("^(?:([^:/?#]+):\\/\\/)?([^/?#]*)([^?#]*)(?:\\?([^#]*))?(?:#(.*))?$", "i");
        var k = "tweet-url list-slug",
            l = "tweet-url username",
            m = "tweet-url hashtag",
            n = "tweet-url cashtag",
            o = {
                urlClass: !0,
                listClass: !0,
                usernameClass: !0,
                hashtagClass: !0,
                cashtagClass: !0,
                usernameUrlBase: !0,
                listUrlBase: !0,
                hashtagUrlBase: !0,
                cashtagUrlBase: !0,
                usernameUrlBlock: !0,
                listUrlBlock: !0,
                hashtagUrlBlock: !0,
                linkUrlBlock: !0,
                usernameIncludeSymbol: !0,
                suppressLists: !0,
                suppressNoFollow: !0,
                suppressDataScreenName: !0,
                urlEntities: !0,
                symbolTag: !0,
                textWithSymbolTag: !0,
                urlTarget: !0,
                invisibleTagAttrs: !0,
                linkAttributeBlock: !0,
                linkTextBlock: !0,
                htmlEscapeNonEntities: !0
            }, p = {
                disabled: !0,
                readonly: !0,
                multiple: !0,
                checked: !0
            };
        b.txt.tagAttrs = function(a) {
            var c = "";
            for (var d in a) {
                var e = a[d];
                p[d] && (e = e ? d : null);
                if (e == null) continue;
                c += " " + b.txt.htmlEscape(d) + '="' + b.txt.htmlEscape(e.toString()) + '"'
            }
            return c
        }, b.txt.linkToText = function(a, c, e, f) {
            f.suppressNoFollow || (e.rel = "nofollow"), f.linkAttributeBlock && f.linkAttributeBlock(a, e), f.linkTextBlock && (c = f.linkTextBlock(a, c));
            var g = {
                text: c,
                attr: b.txt.tagAttrs(e)
            };
            return d("<a#{attr}>#{text}</a>", g)
        }, b.txt.linkToTextWithSymbol = function(a, c, d, e, f) {
            var g = f.symbolTag ? "<" + f.symbolTag + ">" + c + "</" + f.symbolTag + ">" : c;
            d = b.txt.htmlEscape(d);
            var h = f.textWithSymbolTag ? "<" + f.textWithSymbolTag + ">" + d + "</" + f.textWithSymbolTag + ">" : d;
            return f.usernameIncludeSymbol || !c.match(b.txt.regexen.atSigns) ? b.txt.linkToText(a, g + h, e, f) : g + b.txt.linkToText(a, h, e, f)
        }, b.txt.linkToHashtag = function(a, c, d) {
            var e = c.substring(a.indices[0], a.indices[0] + 1),
                f = b.txt.htmlEscape(a.hashtag),
                g = q(d.htmlAttrs || {});
            return g.href = d.hashtagUrlBase + f, g.title = "#" + f, g["class"] = d.hashtagClass, f[0].match(b.txt.regexen.rtl_chars) && (g["class"] += " rtl"), b.txt.linkToTextWithSymbol(a, e, f, g, d)
        }, b.txt.linkToCashtag = function(a, c, d) {
            var e = b.txt.htmlEscape(a.cashtag),
                f = q(d.htmlAttrs || {});
            return f.href = d.cashtagUrlBase + e, f.title = "$" + e, f["class"] = d.cashtagClass, b.txt.linkToTextWithSymbol(a, "$", e, f, d)
        }, b.txt.linkToMentionAndList = function(a, c, d) {
            var e = c.substring(a.indices[0], a.indices[0] + 1),
                f = b.txt.htmlEscape(a.screenName),
                g = b.txt.htmlEscape(a.listSlug),
                h = a.listSlug && !d.suppressLists,
                i = q(d.htmlAttrs || {});
            return i["class"] = h ? d.listClass : d.usernameClass, i.href = h ? d.listUrlBase + f + g : d.usernameUrlBase + f, !h && !d.suppressDataScreenName && (i["data-screen-name"] = f), b.txt.linkToTextWithSymbol(a, e, h ? f + g : f, i, d)
        }, b.txt.linkToUrl = function(a, c, d) {
            var e = a.url,
                f = e,
                g = b.txt.htmlEscape(f),
                h = d.urlEntities && d.urlEntities[e] || a;
            h.display_url && (g = b.txt.linkTextWithEntity(h, d));
            var i = q(d.htmlAttrs || {});
            return i.href = e, d.urlClass && (i["class"] = d.urlClass), d.urlTarget && (i.target = d.urlTarget), !d.title && h.display_url && (i.title = h.expanded_url), b.txt.linkToText(a, g, i, d)
        }, b.txt.linkTextWithEntity = function(a, c) {
            var e = a.display_url,
                f = a.expanded_url,
                g = e.replace(/â€¦/g, "");
            if (f.indexOf(g) != -1) {
                var h = f.indexOf(g),
                    i = {
                        displayUrlSansEllipses: g,
                        beforeDisplayUrl: f.substr(0, h),
                        afterDisplayUrl: f.substr(h + g.length),
                        precedingEllipsis: e.match(/^â€¦/) ? "â€¦" : "",
                        followingEllipsis: e.match(/â€¦$/) ? "â€¦" : ""
                    };
                for (var j in i) i.hasOwnProperty(j) && (i[j] = b.txt.htmlEscape(i[j]));
                return i.invisible = c.invisibleTagAttrs, d("<span class='tco-ellipsis'>#{precedingEllipsis}<span #{invisible}>&nbsp;</span></span><span #{invisible}>#{beforeDisplayUrl}</span><span class='js-display-url'>#{displayUrlSansEllipses}</span><span #{invisible}>#{afterDisplayUrl}</span><span class='tco-ellipsis'><span #{invisible}>&nbsp;</span>#{followingEllipsis}</span>", i)
            }
            return e
        }, b.txt.autoLinkEntities = function(a, c, d) {
            d = q(d || {}), d.hashtagClass = d.hashtagClass || m, d.hashtagUrlBase = d.hashtagUrlBase || "https://twitter.com/#!/search?q=%23", d.cashtagClass = d.cashtagClass || n, d.cashtagUrlBase = d.cashtagUrlBase || "https://twitter.com/#!/search?q=%24", d.listClass = d.listClass || k, d.usernameClass = d.usernameClass || l, d.usernameUrlBase = d.usernameUrlBase || "https://twitter.com/", d.listUrlBase = d.listUrlBase || "https://twitter.com/", d.htmlAttrs = b.txt.extractHtmlAttrsFromOptions(d), d.invisibleTagAttrs = d.invisibleTagAttrs || "style='position:absolute;left:-9999px;'";
            var e, f, g;
            if (d.urlEntities) {
                e = {};
                for (f = 0, g = d.urlEntities.length; f < g; f++) e[d.urlEntities[f].url] = d.urlEntities[f];
                d.urlEntities = e
            }
            var h = "",
                i = 0;
            c.sort(function(a, b) {
                return a.indices[0] - b.indices[0]
            });
            var j = d.htmlEscapeNonEntities ? b.txt.htmlEscape : function(a) {
                    return a
                };
            for (var f = 0; f < c.length; f++) {
                var o = c[f];
                h += j(a.substring(i, o.indices[0])), o.url ? h += b.txt.linkToUrl(o, a, d) : o.hashtag ? h += b.txt.linkToHashtag(o, a, d) : o.screenName ? h += b.txt.linkToMentionAndList(o, a, d) : o.cashtag && (h += b.txt.linkToCashtag(o, a, d)), i = o.indices[1]
            }
            return h += j(a.substring(i, a.length)), h
        }, b.txt.autoLinkWithJSON = function(a, c, d) {
            var e = [];
            for (var f in c) e = e.concat(c[f]);
            for (var g = 0; g < e.length; g++) entity = e[g], entity.screen_name ? entity.screenName = entity.screen_name : entity.text && (entity.hashtag = entity.text);
            return b.txt.modifyIndicesFromUnicodeToUTF16(a, e), b.txt.autoLinkEntities(a, e, d)
        }, b.txt.extractHtmlAttrsFromOptions = function(a) {
            var b = {};
            for (var c in a) {
                var d = a[c];
                if (o[c]) continue;
                p[c] && (d = d ? c : null);
                if (d == null) continue;
                b[c] = d
            }
            return b
        }, b.txt.autoLink = function(a, c) {
            var d = b.txt.extractEntitiesWithIndices(a, {
                extractUrlWithoutProtocol: !1
            });
            return b.txt.autoLinkEntities(a, d, c)
        }, b.txt.autoLinkUsernamesOrLists = function(a, c) {
            var d = b.txt.extractMentionsOrListsWithIndices(a);
            return b.txt.autoLinkEntities(a, d, c)
        }, b.txt.autoLinkHashtags = function(a, c) {
            var d = b.txt.extractHashtagsWithIndices(a);
            return b.txt.autoLinkEntities(a, d, c)
        }, b.txt.autoLinkCashtags = function(a, c) {
            var d = b.txt.extractCashtagsWithIndices(a);
            return b.txt.autoLinkEntities(a, d, c)
        }, b.txt.autoLinkUrlsCustom = function(a, c) {
            var d = b.txt.extractUrlsWithIndices(a, {
                extractUrlWithoutProtocol: !1
            });
            return b.txt.autoLinkEntities(a, d, c)
        }, b.txt.removeOverlappingEntities = function(a) {
            a.sort(function(a, b) {
                return a.indices[0] - b.indices[0]
            });
            var b = a[0];
            for (var c = 1; c < a.length; c++) b.indices[1] > a[c].indices[0] ? (a.splice(c, 1), c--) : b = a[c]
        }, b.txt.extractEntitiesWithIndices = function(a, c) {
            var d = b.txt.extractUrlsWithIndices(a, c).concat(b.txt.extractMentionsOrListsWithIndices(a)).concat(b.txt.extractHashtagsWithIndices(a, {
                checkUrlOverlap: !1
            })).concat(b.txt.extractCashtagsWithIndices(a));
            return d.length == 0 ? [] : (b.txt.removeOverlappingEntities(d), d)
        }, b.txt.extractMentions = function(a) {
            var c = [],
                d = b.txt.extractMentionsWithIndices(a);
            for (var e = 0; e < d.length; e++) {
                var f = d[e].screenName;
                c.push(f)
            }
            return c
        }, b.txt.extractMentionsWithIndices = function(a) {
            var c = [],
                d = b.txt.extractMentionsOrListsWithIndices(a);
            for (var e = 0; e < d.length; e++) mentionOrList = d[e], mentionOrList.listSlug == "" && c.push({
                screenName: mentionOrList.screenName,
                indices: mentionOrList.indices
            });
            return c
        }, b.txt.extractMentionsOrListsWithIndices = function(a) {
            if (!a || !a.match(b.txt.regexen.atSigns)) return [];
            var c = [];
            return a.replace(b.txt.regexen.validMentionOrList, function(a, d, e, f, g, h, i) {
                var j = i.slice(h + a.length);
                if (!j.match(b.txt.regexen.endMentionMatch)) {
                    g = g || "";
                    var k = h + d.length,
                        l = k + f.length + g.length + 1;
                    c.push({
                        screenName: f,
                        listSlug: g,
                        indices: [k, l]
                    })
                }
            }), c
        }, b.txt.extractReplies = function(a) {
            if (!a) return null;
            var c = a.match(b.txt.regexen.validReply);
            return !c || RegExp.rightContext.match(b.txt.regexen.endMentionMatch) ? null : c[1]
        }, b.txt.extractUrls = function(a, c) {
            var d = [],
                e = b.txt.extractUrlsWithIndices(a, c);
            for (var f = 0; f < e.length; f++) d.push(e[f].url);
            return d
        }, b.txt.extractUrlsWithIndices = function(a, c) {
            c || (c = {
                extractUrlsWithoutProtocol: !0
            });
            if (!a || (c.extractUrlsWithoutProtocol ? !a.match(/\./) : !a.match(/:/))) return [];
            var d = [];
            while (b.txt.regexen.extractUrl.exec(a)) {
                var e = RegExp.$2,
                    f = RegExp.$3,
                    g = RegExp.$4,
                    h = RegExp.$5,
                    i = RegExp.$7,
                    j = b.txt.regexen.extractUrl.lastIndex,
                    k = j - f.length;
                if (!g) {
                    if (!c.extractUrlsWithoutProtocol || e.match(b.txt.regexen.invalidUrlWithoutProtocolPrecedingChars)) continue;
                    var l = null,
                        m = !1,
                        n = 0;
                    h.replace(b.txt.regexen.validAsciiDomain, function(a) {
                        var c = h.indexOf(a, n);
                        n = c + a.length, l = {
                            url: a,
                            indices: [k + c, k + n]
                        }, m = a.match(b.txt.regexen.invalidShortDomain), m || d.push(l)
                    });
                    if (l == null) continue;
                    i && (m && d.push(l), l.url = f.replace(h, l.url), l.indices[1] = j)
                } else f.match(b.txt.regexen.validTcoUrl) && (f = RegExp.lastMatch, j = k + f.length), d.push({
                    url: f,
                    indices: [k, j]
                })
            }
            return d
        }, b.txt.extractHashtags = function(a) {
            var c = [],
                d = b.txt.extractHashtagsWithIndices(a);
            for (var e = 0; e < d.length; e++) c.push(d[e].hashtag);
            return c
        }, b.txt.extractHashtagsWithIndices = function(a, c) {
            c || (c = {
                checkUrlOverlap: !0
            });
            if (!a || !a.match(b.txt.regexen.hashSigns)) return [];
            var d = [];
            a.replace(b.txt.regexen.validHashtag, function(a, c, e, f, g, h) {
                var i = h.slice(g + a.length);
                if (i.match(b.txt.regexen.endHashtagMatch)) return;
                var j = g + c.length,
                    k = j + f.length + 1;
                d.push({
                    hashtag: f,
                    indices: [j, k]
                })
            });
            if (c.checkUrlOverlap) {
                var e = b.txt.extractUrlsWithIndices(a);
                if (e.length > 0) {
                    var f = d.concat(e);
                    b.txt.removeOverlappingEntities(f), d = [];
                    for (var g = 0; g < f.length; g++) f[g].hashtag && d.push(f[g])
                }
            }
            return d
        }, b.txt.extractCashtags = function(a) {
            var c = [],
                d = b.txt.extractCashtagsWithIndices(a);
            for (var e = 0; e < d.length; e++) c.push(d[e].cashtag);
            return c
        }, b.txt.extractCashtagsWithIndices = function(a) {
            if (!a || a.indexOf("$") == -1) return [];
            var c = [];
            return a.replace(b.txt.regexen.validCashtag, function(a, b, d, e, f, g) {
                var h = f + b.length,
                    i = h + e.length + 1;
                c.push({
                    cashtag: e,
                    indices: [h, i]
                })
            }), c
        }, b.txt.modifyIndicesFromUnicodeToUTF16 = function(a, c) {
            b.txt.convertUnicodeIndices(a, c, !1)
        }, b.txt.modifyIndicesFromUTF16ToUnicode = function(a, c) {
            b.txt.convertUnicodeIndices(a, c, !0)
        }, b.txt.getUnicodeTextLength = function(a) {
            return a.replace(b.txt.regexen.non_bmp_code_pairs, " ").length
        }, b.txt.convertUnicodeIndices = function(a, b, c) {
            if (b.length == 0) return;
            var d = 0,
                e = 0;
            b.sort(function(a, b) {
                return a.indices[0] - b.indices[0]
            });
            var f = 0,
                g = b[0];
            while (d < a.length) {
                if (g.indices[0] == (c ? d : e)) {
                    var h = g.indices[1] - g.indices[0];
                    g.indices[0] = c ? e : d, g.indices[1] = g.indices[0] + h, f++;
                    if (f == b.length) break;
                    g = b[f]
                }
                var i = a.charCodeAt(d);
                55296 <= i && i <= 56319 && d < a.length - 1 && (i = a.charCodeAt(d + 1), 56320 <= i && i <= 57343 && d++), e++, d++
            }
        }, b.txt.splitTags = function(a) {
            var b = a.split("<"),
                c, d = [],
                e;
            for (var f = 0; f < b.length; f += 1) {
                e = b[f];
                if (!e) d.push("");
                else {
                    c = e.split(">");
                    for (var g = 0; g < c.length; g += 1) d.push(c[g])
                }
            }
            return d
        }, b.txt.hitHighlight = function(a, c, d) {
            var e = "em";
            c = c || [], d = d || {};
            if (c.length === 0) return a;
            var f = d.tag || e,
                g = ["<" + f + ">", "</" + f + ">"],
                h = b.txt.splitTags(a),
                i, j, k = "",
                l = 0,
                m = h[0],
                n = 0,
                o = 0,
                p = !1,
                q = m,
                r = [],
                s, t, u, v, w;
            for (i = 0; i < c.length; i += 1) for (j = 0; j < c[i].length; j += 1) r.push(c[i][j]);
            for (s = 0; s < r.length; s += 1) {
                t = r[s], u = g[s % 2], v = !1;
                while (m != null && t >= n + m.length) k += q.slice(o), p && t === n + q.length && (k += u, v = !0), h[l + 1] && (k += "<" + h[l + 1] + ">"), n += q.length, o = 0, l += 2, m = h[l], q = m, p = !1;
                !v && m != null ? (w = t - n, k += q.slice(o, w) + u, o = w, s % 2 === 0 ? p = !0 : p = !1) : v || (v = !0, k += u)
            }
            if (m != null) {
                o < q.length && (k += q.slice(o));
                for (s = l + 1; s < h.length; s += 1) k += s % 2 === 0 ? h[s] : "<" + h[s] + ">"
            }
            return k
        };
        var r = 140,
            s = [f(65534), f(65279), f(65535), f(8234), f(8235), f(8236), f(8237), f(8238)];
        b.txt.getTweetLength = function(a, c) {
            c || (c = {
                short_url_length: 22,
                short_url_length_https: 23
            });
            var d = b.txt.getUnicodeTextLength(a),
                e = b.txt.extractUrlsWithIndices(a);
            b.txt.modifyIndicesFromUTF16ToUnicode(a, e);
            for (var f = 0; f < e.length; f++) d += e[f].indices[0] - e[f].indices[1], e[f].url.toLowerCase().match(/^https:\/\//) ? d += c.short_url_length_https : d += c.short_url_length;
            return d
        }, b.txt.isInvalidTweet = function(a) {
            if (!a) return "empty";
            if (b.txt.getTweetLength(a) > r) return "too_long";
            for (var c = 0; c < s.length; c++) if (a.indexOf(s[c]) >= 0) return "invalid_characters";
            return !1
        }, b.txt.isValidTweetText = function(a) {
            return !b.txt.isInvalidTweet(a)
        }, b.txt.isValidUsername = function(a) {
            if (!a) return !1;
            var c = b.txt.extractMentions(a);
            return c.length === 1 && c[0] === a.slice(1)
        };
        var t = c(/^#{validMentionOrList}$/);
        b.txt.isValidList = function(a) {
            var b = a.match(t);
            return !!b && b[1] == "" && !! b[4]
        }, b.txt.isValidHashtag = function(a) {
            if (!a) return !1;
            var c = b.txt.extractHashtags(a);
            return c.length === 1 && c[0] === a.slice(1)
        }, b.txt.isValidUrl = function(a, c, d) {
            c == null && (c = !0), d == null && (d = !0);
            if (!a) return !1;
            var e = a.match(b.txt.regexen.validateUrlUnencoded);
            if (!e || e[0] !== a) return !1;
            var f = e[1],
                g = e[2],
                h = e[3],
                i = e[4],
                j = e[5];
            return (!d || u(f, b.txt.regexen.validateUrlScheme) && f.match(/^https?$/i)) && u(h, b.txt.regexen.validateUrlPath) && u(i, b.txt.regexen.validateUrlQuery, !0) && u(j, b.txt.regexen.validateUrlFragment, !0) ? c && u(g, b.txt.regexen.validateUrlUnicodeAuthority) || !c && u(g, b.txt.regexen.validateUrlAuthority) : !1
        }, typeof module != "undefined" && module.exports && (module.exports = b.txt)
    })(), a(b.txt)
})
define("app/utils/tweet_helper", ["module", "require", "exports", "lib/twitter-text", "core/utils", "app/data/user_info"], function(module, require, exports) {
    var twitterText = require("lib/twitter-text"),
        utils = require("core/utils"),
        userInfo = require("app/data/user_info"),
        VALID_PROTOCOL_PREFIX_REGEX = /^https?:\/\//i,
        tweetHelper = {
            extractMentionsForReply: function(a, b) {
                var c = a.attr("data-screen-name"),
                    d = a.attr("data-mentions") ? a.attr("data-mentions").split(" ") : [];
                return d = d.filter(function(a) {
                    return a !== c && a !== b
                }), d.unshift(c), userInfo.getDecider("compose_9_reply_logic") && c == b && d.length > 1 && d.shift(), d
            },
            linkify: function(a, b) {
                b = utils.merge({
                    hashtagClass: "twitter-hashtag pretty-link",
                    hashtagUrlBase: "/search?q=%23",
                    symbolTag: "s",
                    textWithSymbolTag: "b",
                    cashtagClass: "twitter-cashtag pretty-link",
                    cashtagUrlBase: "/search?q=%24",
                    usernameClass: "twitter-atreply pretty-link",
                    usernameUrlBase: "/",
                    usernameIncludeSymbol: !0,
                    listClass: "twitter-listname pretty-link",
                    urlClass: "twitter-timeline-link",
                    urlTarget: "_blank",
                    suppressNoFollow: !0,
                    htmlEscapeNonEntities: !0
                }, b || {});
                var c = b.linkAttributeBlock;
                return b.linkAttributeBlock = function(a, b) {
                    a.url && !a.url.match(VALID_PROTOCOL_PREFIX_REGEX) && (b.href = "http://" + a.url), c && c(a, b)
                }, twitterText.autoLinkEntities(a, twitterText.extractEntitiesWithIndices(a), b)
            }
        };
    module.exports = tweetHelper
});
define("app/ui/with_tweet_actions", ["module", "require", "exports", "core/compose", "app/ui/with_interaction_data", "app/utils/tweet_helper", "app/utils/cookie"], function(module, require, exports) {
    function withTweetActions() {
        compose.mixin(this, [withInteractionData]), this.defaultAttrs({
            permalinkTweetClass: "permalink-tweet",
            dismissedTweetClass: "js-dismissed-promoted-tweet",
            streamTweetItemSelector: "li.js-stream-item",
            tweetWithReplyDialog: "div.simple-tweet,div.permalink-tweet,div.permalink-tweet div.proxy-tweet-container div.tweet,li.disco-stream-item div.tweet,div.slideshow-tweet div.proxy-tweet-container div.tweet",
            proxyTweetSelector: "div.proxy-tweet-container div.tweet",
            tweetItemSelector: "div.tweet",
            tweetActionsSelector: "div.tweet ul.js-actions",
            favoriteSelector: "div.tweet ul.js-actions a.js-toggle-fav",
            retweetSelector: "div.tweet ul.js-actions a.js-toggle-rt",
            replySelector: "div.tweet ul.js-actions a.js-action-reply",
            deleteSelector: "div.tweet ul.js-actions a.js-action-del",
            permalinkSelector: "div.tweet .js-permalink",
            anyLoggedInActionSelector: "div.tweet .js-actions a:not(.js-embed-tweet):not(.dropdown-toggle)",
            dismissTweetSelector: "div.tweet .js-action-dismiss",
            dismissedTweetSelector: ".js-dismissed-promoted-tweet",
            promotedTweetStoreCookieName: "h",
            moreOptionsSelector: "div.tweet ul.js-actions li.action-more-container div.dropdown",
            shareViaEmailSelector: "div.tweet ul.js-actions ul.dropdown-menu a.js-share-via-email",
            embedTweetSelector: "div.tweet ul.js-actions ul.dropdown-menu a.js-embed-tweet"
        }), this.toggleRetweet = function(a, b) {
            var c = this.findTweet(b.tweet_id);
            c.attr("data-my-retweet-id") ? c.removeAttr("data-my-retweet-id") : c.attr("data-my-retweet-id", b.retweet_id), a.preventDefault()
        }, this.handleTransition = function(a, b) {
            return function(c, d) {
                var e = d.id || d.sourceEventData.id,
                    f = this.$node.find(this.attr.tweetItemSelector + "[data-tweet-id=" + e + "]");
                f[a](b);
                if (this.attr.proxyTweetSelector) {
                    var g = this.$node.find(this.attr.proxyTweetSelector + "[data-tweet-id=" + e + "]");
                    g[a](b)
                }
                c.preventDefault()
            }
        }, this.getTweetData = function(a) {
            var b = this.interactionData(a);
            return b.id = b.tweetId, b.screenName = a.attr("data-screen-name"), b.screenNames = tweetHelper.extractMentionsForReply(a, this.attr.screenName), b.isTweetProof = a.attr("data-is-tweet-proof") === "true", b
        }, this.handleReply = function(a, b, c) {
            var d = this.$tweetForEvent(a, c),
                e = this.getTweetData(d);
            e.replyLinkClick = !0, d.is(this.attr.tweetWithReplyDialog) || d.attr("data-use-reply-dialog") === "true" || d.attr("data-is-tweet-proof") === "true" ? this.trigger(d, "uiOpenReplyDialog", e) : this.trigger(d, "expandTweetByReply", e), a.preventDefault(), a.stopPropagation()
        }, this.$tweetForEvent = function(a, b) {
            var c = b ? "find" : "closest",
                d = $(a.target)[c](this.attr.tweetItemSelector);
            return d.find(this.attr.proxyTweetSelector).length == 1 ? d.find(this.attr.proxyTweetSelector) : d
        }, this.$containerTweet = function(a) {
            return $(a.target).closest(this.attr.tweetItemSelector)
        }, this.handleAction = function(a, b, c, d) {
            return function(e) {
                var f = this.$tweetForEvent(e, d),
                    g = this.getTweetData(f);
                !a || f.hasClass(a) ? this.trigger(f, b, g) : c && this.trigger(f, c, g), e.preventDefault(), e.stopPropagation()
            }
        }, this.handlePermalinkClick = function(a, b) {
            var c = this.$tweetForEvent(a),
                d = this.getTweetData(c);
            this.trigger(c, "uiPermalinkClick", d)
        }, this.handleTweetDelete = function(a, b) {
            var c = this.findTweet(b.sourceEventData.id);
            c.each(function(a, c) {
                var d = $(c);
                d.hasClass(this.attr.permalinkTweetClass) ? window.location.replace("/") : d.is(this.attr.tweetWithReplyDialog) ? (d.closest("li").remove(), this.trigger("uiTweetRemoved", b)) : (d.closest(this.attr.streamTweetItemSelector).remove(), this.trigger("uiTweetRemoved", b))
            }.bind(this)), this.select("tweetItemSelector").length || (this.$node.hasClass("replies-to") ? this.$node.addClass("hidden") : this.$node.hasClass("in-reply-to") ? this.$node.remove() : this.select("timelineEndSelector").removeClass("has-items"))
        }, this.findTweet = function(a) {
            return this.$node.find(this.attr.tweetItemSelector + "[data-tweet-id=" + a + "]")
        }, this.handleLoggedOutActionClick = function(a) {
            a.preventDefault(), a.stopPropagation(), this.trigger("uiOpenSigninOrSignupDialog", {
                signUpOnly: !1,
                screenName: this.$tweetForEvent(a).attr("data-screen-name")
            })
        }, this.dismissTweet = function(a) {
            var b = this.$tweetForEvent(a),
                c = b.closest(this.attr.streamTweetItemSelector),
                d = this.getTweetData(b);
            c.addClass(this.attr.dismissedTweetClass).fadeOut(200, function() {
                this.removeTweet(c)
            }.bind(this)), c.prev().removeClass("before-expanded"), c.next().removeClass("after-expanded"), this.trigger("uiTweetDismissed", d), cookie(this.attr.promotedTweetStoreCookieName, null)
        }, this.removeTweet = function(a) {
            a.remove()
        }, this.removeAllDismissed = function() {
            this.select("dismissedTweetSelector").stop(), this.removeTweet(this.select("dismissedTweetSelector"))
        }, this.toggleDropdownDisplay = function(a) {
            $(a.target).closest(this.attr.moreOptionsSelector).toggleClass("open"), a.preventDefault(), a.stopPropagation()
        }, this.closeAllDropdownSelectors = function(a) {
            $("div.tweet div.dropdown.open").removeClass("open")
        }, this.after("initialize", function(a) {
            this.on("click", {
                moreOptionsSelector: this.toggleDropdownDisplay,
                embedTweetSelector: this.handleAction("", "uiNeedsEmbedTweetDialog")
            }), this.on(this.attr.tweetItemSelector, "mouseleave", this.closeAllDropdownSelectors);
            if (!this.attr.loggedIn) {
                this.on("click", {
                    anyLoggedInActionSelector: this.handleLoggedOutActionClick
                });
                return
            }
            this.on(document, "dataDidDeleteTweet", this.handleTweetDelete), this.on(document, "dataDidRetweet dataDidUnretweet", this.toggleRetweet), this.on(document, "uiDidFavoriteTweet dataFailedToUnfavoriteTweet", this.handleTransition("addClass", "favorited")), this.on(document, "uiDidUnfavoriteTweet dataFailedToFavoriteTweet", this.handleTransition("removeClass", "favorited")), this.on(document, "uiDidRetweet dataFailedToUnretweet", this.handleTransition("addClass", "retweeted")), this.on(document, "uiDidUnretweet dataFailedToRetweet", this.handleTransition("removeClass", "retweeted")), this.on("click", {
                favoriteSelector: this.handleAction("favorited", "uiDidUnfavoriteTweet", "uiDidFavoriteTweet"),
                retweetSelector: this.handleAction("retweeted", "uiDidUnretweet", "uiOpenRetweetDialog"),
                replySelector: this.handleReply,
                deleteSelector: this.handleAction("", "uiOpenDeleteDialog"),
                permalinkSelector: this.handlePermalinkClick,
                dismissTweetSelector: this.dismissTweet,
                shareViaEmailSelector: this.handleAction("", "uiNeedsShareViaEmailDialog")
            }), this.on(document, "uiDidFavoriteTweetToggle", this.handleAction("favorited", "uiDidUnfavoriteTweet", "uiDidFavoriteTweet", !0)), this.on(document, "uiDidRetweetTweetToggle", this.handleAction("retweeted", "uiDidUnretweet", "uiOpenRetweetDialog", !0)), this.on(document, "uiDidReplyTweetToggle", this.handleReply), this.on(document, "uiBeforePageChanged", this.removeAllDismissed)
        })
    }
    var compose = require("core/compose"),
        withInteractionData = require("app/ui/with_interaction_data"),
        tweetHelper = require("app/utils/tweet_helper"),
        cookie = require("app/utils/cookie");
    module.exports = withTweetActions
});
define("app/ui/with_user_actions", ["module", "require", "exports", "core/compose", "core/i18n", "core/utils", "app/data/ddg", "app/ui/with_interaction_data"], function(module, require, exports) {
    function withUserActions() {
        compose.mixin(this, [withInteractionData]), this.defaultAttrs({
            followButtonSelector: ".follow-button, .follow-link",
            userInfoSelector: ".user-actions",
            dropdownSelector: ".user-dropdown",
            dropdownItemSelector: ".user-dropdown li",
            dropdownMenuSelector: ".dropdown-menu",
            dropdownThresholdSelector: ".dropdown-threshold",
            followStates: ["not-following", "following", "blocked", "pending"],
            userActionClassesToEvents: {
                "mention-text": ["uiMentionAction", "mentionUser"],
                "dm-text": ["uiDmAction", "dmUser"],
                "list-text": ["uiListAction"],
                "block-text": ["uiBlockAction"],
                "unblock-text": ["uiUnblockAction"],
                "report-spam-text": ["uiReportSpamAction"],
                "hide-suggestion-text": ["uiHideSuggestionAction"],
                "retweet-on-text": ["uiRetweetOnAction"],
                "retweet-off-text": ["uiRetweetOffAction"],
                "device-notifications-on-text": ["uiDeviceNotificationsOnAction", "deviceNotificationsOn"],
                "device-notifications-off-text": ["uiDeviceNotificationsOffAction"],
                "embed-profile": ["uiEmbedProfileAction", "redirectToEmbedProfile"]
            }
        }), this.getClassNameFromList = function(a, b) {
            var c = b.filter(function(b) {
                return a.hasClass(b)
            });
            return c.length > 1 && console.log("Element has more than one mutually exclusive class.", c), c[0]
        }, this.getUserActionEventNameAndMethod = function(a) {
            var b = this.getClassNameFromList(a, Object.keys(this.attr.userActionClassesToEvents));
            return this.attr.userActionClassesToEvents[b]
        }, this.getFollowState = function(a) {
            return this.getClassNameFromList(a, this.attr.followStates)
        }, this.getInfoElementFromEvent = function(a) {
            var b = $(a.target);
            return b.closest(this.attr.userInfoSelector)
        }, this.findInfoElementForUser = function(a) {
            var b = this.attr.userInfoSelector + "[data-user-id=" + parseInt(a, 10) + "]";
            return this.$node.find(b)
        }, this.getEventName = function(a) {
            var b = {
                "not-following": "uiFollowAction",
                following: "uiUnfollowAction",
                blocked: "uiUnblockAction",
                pending: "uiCancelFollowRequestAction"
            };
            return b[a]
        }, this.addCancelHoverStyleClass = function(a) {
            a.addClass("cancel-hover-style"), a.one("mouseleave", function() {
                a.removeClass("cancel-hover-style")
            })
        }, this.handleFollowButtonClick = function(a) {
            a.preventDefault();
            var b = this.getInfoElementFromEvent(a),
                c = $(a.target).closest(this.attr.followButtonSelector);
            this.addCancelHoverStyleClass(c);
            var d = this.getFollowState(b);
            d == "not-following" && b.attr("data-protected") == "true" && this.trigger("uiShowMessage", {
                message: _('A follow request has been sent to @{{screen_name}} and is pending their approval.', {
                    screen_name: b.attr("data-screen-name")
                })
            });
            var e = this.getEventName(d),
                f = {
                    originalFollowState: d
                };
            this.trigger(e, this.interactionData(a, f))
        }, this.handleLoggedOutFollowButtonClick = function(a) {
            this.trigger("uiOpenSigninOrSignupDialog", {
                signUpOnly: !0,
                screenName: this.getInfoElementFromEvent(a).attr("data-screen-name")
            })
        }, this.handleUserAction = function(a) {
            var b = $(a.target),
                c = this.getInfoElementFromEvent(a),
                d = this.getUserActionEventNameAndMethod(b),
                e = d[0],
                f = d[1],
                g = this.getFollowState(c),
                h = {
                    originalFollowState: g
                };
            f && (h = this[f](c, e, h)), h && this.trigger(e, this.interactionData(a, h))
        }, this.deviceNotificationsOn = function(a, b, c) {
            return this.attr.deviceEnabled ? c : (this.attr.smsDeviceVerified || this.attr.hasPushDevice ? this.trigger("uiOpenConfirmDialog", {
                titleText: _('Enable mobile notifications for Tweets'),
                bodyText: _('Before you can receive mobile notifications for @{{screenName}}\'s Tweets, you need to enable the Tweet notification setting.', {
                    screenName: a.attr("data-screen-name")
                }),
                cancelText: _('Close'),
                submitText: _('Enable Tweet notifications'),
                action: this.attr.hasPushDevice ? "ShowPushTweetsNotifications" : "ShowMobileNotifications",
                top: this.attr.top
            }) : this.trigger("uiOpenConfirmDialog", {
                titleText: _('Setup mobile notifications'),
                bodyText: _('Before you can receive mobile notifications for @{{screenName}}\'s Tweets, you need to set up your phone.', {
                    screenName: a.attr("data-screen-name")
                }),
                cancelText: _('Cancel'),
                submitText: _('Set up phone'),
                action: "ShowMobileNotifications",
                top: this.attr.top
            }), !1)
        }, this.redirectToMobileNotifications = function() {
            window.location = "/settings/devices"
        }, this.redirectToPushNotificationsHelp = function() {
            window.location = "//support.twitter.com/articles/20169887"
        }, this.redirectToEmbedProfile = function(a, b, c) {
            return this.trigger("uiNavigate", {
                href: "/settings/widgets/new/user?screen_name=" + a.attr("data-screen-name")
            }), !0
        }, this.mentionUser = function(a, b, c) {
            this.trigger("uiOpenTweetDialog", {
                screenName: a.attr("data-screen-name"),
                title: _('Tweet to {{name}}', {
                    name: a.attr("data-name")
                })
            })
        }, this.dmUser = function(a, b, c) {
            return this.trigger("uiOpenDMConversation", {
                screen_name: a.attr("data-screen-name"),
                name: a.attr("data-name")
            }), c
        }, this.hideSuggestion = function(a, b, c) {
            return utils.merge(c, {
                feedbackToken: a.attr("data-feedback-token")
            })
        }, this.followStateChange = function(a, b) {
            this.updateFollowState(b.userId, b.newState), b.fromShortcut && (b.newState === "not-following" ? this.trigger("uiShowMessage", {
                message: _('You have unblocked {{username}}', {
                    username: b.username
                })
            }) : b.newState === "blocked" && this.trigger("uiUpdateAfterBlock", {
                userId: b.userId
            }))
        }, this.updateFollowState = function(a, b) {
            var c = this.findInfoElementForUser(a),
                d = this.getFollowState(c);
            d && c.removeClass(d), c.addClass(b)
        }, this.follow = function(a, b) {
            var c = this.findInfoElementForUser(b.userId),
                d = c.data("protected") ? "pending" : "following";
            this.updateFollowState(b.userId, d), c.addClass("including")
        }, this.unfollow = function(a, b) {
            var c = this.findInfoElementForUser(b.userId);
            this.updateFollowState(b.userId, "not-following"), c.removeClass("including notifying")
        }, this.cancel = function(a, b) {
            var c = this.findInfoElementForUser(b.userId);
            this.updateFollowState(b.userId, "not-following")
        }, this.block = function(a, b) {
            var c = this.findInfoElementForUser(b.userId);
            this.updateFollowState(b.userId, "blocked"), c.removeClass("including notifying")
        }, this.unblock = function(a, b) {
            this.updateFollowState(b.userId, "not-following")
        }, this.retweetsOn = function(a, b) {
            var c = this.findInfoElementForUser(b.userId);
            c.addClass("including")
        }, this.retweetsOff = function(a, b) {
            var c = this.findInfoElementForUser(b.userId);
            c.removeClass("including")
        }, this.notificationsOn = function(a, b) {
            var c = this.findInfoElementForUser(b.userId);
            c.addClass("notifying")
        }, this.notificationsOff = function(a, b) {
            var c = this.findInfoElementForUser(b.userId);
            c.removeClass("notifying")
        }, this.toggleDropdown = function(a) {
            a.stopPropagation();
            var b = $(a.target).closest(this.attr.dropdownSelector);
            b.hasClass("open") ? this.hideDropdown() : (ddg.impression("mobile_notifications_tweaks_608"), this.showDropdown(b))
        }, this.showDropdown = function(a) {
            this.trigger("click.dropdown"), a.addClass("open");
            var b = a.closest(this.attr.dropdownThresholdSelector);
            if (b.length) {
                var c = a.find(this.attr.dropdownMenuSelector),
                    d = c.offset().top + c.outerHeight() - (b.offset().top + b.height());
                d > 0 && b.animate({
                    scrollTop: b.scrollTop() + d
                })
            }
            this.on(document, "click.dropdown", this.hideDropdown)
        }, this.hideDropdown = function() {
            var a = $("body").find(this.attr.dropdownSelector);
            a.removeClass("open"), this.off(document, "click.dropdown", this.hideDropdown)
        }, this.blockUserConfirmed = function(a, b) {
            a.stopImmediatePropagation(), this.trigger("uiBlockAction", b.sourceEventData)
        }, this.after("initialize", function() {
            if (!this.attr.loggedIn) {
                this.on("click", {
                    followButtonSelector: this.handleLoggedOutFollowButtonClick
                });
                return
            }
            this.on("click", {
                followButtonSelector: this.handleFollowButtonClick,
                dropdownSelector: this.toggleDropdown,
                dropdownItemSelector: this.handleUserAction
            }), this.on(document, "uiFollowStateChange dataFollowStateChange dataBulkFollowStateChange", this.followStateChange), this.on(document, "uiFollowAction", this.follow), this.on(document, "uiUnfollowAction", this.unfollow), this.on(document, "uiCancelFollowRequestAction", this.cancel), this.on(document, "uiBlockAction uiReportSpamAction", this.block), this.on(document, "uiUnblockAction", this.unblock), this.on(document, "uiRetweetOnAction dataRetweetOnAction", this.retweetsOn), this.on(document, "uiRetweetOffAction dataRetweetOffAction", this.retweetsOff), this.on(document, "uiDeviceNotificationsOnAction dataDeviceNotificationsOnAction", this.notificationsOn), this.on(document, "uiDeviceNotificationsOffAction dataDeviceNotificationsOffAction", this.notificationsOff), this.on(document, "uiShowMobileNotificationsConfirm", this.redirectToMobileNotifications), this.on(document, "uiShowPushTweetsNotificationsConfirm", this.redirectToPushNotificationsHelp), this.on(document, "uiBeforePageChanged", this.hideDropdown), this.on(document, "uiDidBlockUser", this.blockUserConfirmed)
        })
    }
    var compose = require("core/compose"),
        _ = require("core/i18n"),
        utils = require("core/utils"),
        ddg = require("app/data/ddg"),
        withInteractionData = require("app/ui/with_interaction_data");
    module.exports = withUserActions
});
define("app/ui/gallery/with_gallery", ["module", "require", "exports"], function(module, require, exports) {
    module.exports = function() {
        this.defaultAttrs({
            mediaSelector: ".media-thumbnail"
        }), this.openGallery = function(a) {
            a.preventDefault(), a.stopPropagation(), this.trigger(a.target, "uiOpenGallery", {
                title: "Photo"
            });
            var b = $(a.target);
            this.trigger("uiMediaThumbnailClick", {
                url: b.attr("data-url")
            })
        }, this.after("initialize", function(a) {
            (a.permalinkCardsGallery || a.timelineCardsGallery) && this.on("click", {
                mediaSelector: this.openGallery
            })
        })
    }
});
define("app/ui/with_item_actions", ["module", "require", "exports", "core/utils", "core/compose", "app/ui/with_interaction_data", "app/data/with_card_metadata"], function(module, require, exports) {
    function withItemActions() {
        compose.mixin(this, [withInteractionData, withCardMetadata]), this.defaultAttrs({
            nestedContainerSelector: ".js-stream-item .in-reply-to, .js-expansion-container",
            showWithScreenNameSelector: ".show-popup-with-screen-name, .twitter-atreply",
            showWithIdSelector: ".show-popup-with-id, .js-user-profile-link",
            searchtagSelector: ".twitter-hashtag, .twitter-cashtag",
            cashtagSelector: ".twitter-cashtag",
            itemLinkSelector: ".twitter-timeline-link"
        }), this.showProfilePopupWithScreenName = function(a, b) {
            var c = $(a.target).closest(this.attr.showWithScreenNameSelector).text();
            c[0] === "@" && (c = c.substring(1));
            var d = {
                screenName: c
            }, e = this.getCardDataFromTweet($(a.target));
            b = utils.merge(this.interactionData(a, d), e), this.showProfile(a, b)
        }, this.showProfilePopupWithId = function(a, b) {
            var c = this.getCardDataFromTweet($(a.target));
            b = utils.merge(this.interactionData(a), c), this.showProfile(a, b)
        }, this.showProfile = function(a, b) {
            this.modifierKey(a) ? this.trigger(a.target, "uiShowProfileNewWindow", b) : (a.preventDefault(), this.trigger("uiShowProfilePopup", b))
        }, this.searchtagClick = function(a, b) {
            var c = $(a.target),
                d = c.closest(this.attr.searchtagSelector),
                e = d.is(this.attr.cashtagSelector) ? "uiCashtagClick" : "uiHashtagClick",
                f = {
                    query: d.text()
                };
            this.trigger(e, this.interactionData(a, f))
        }, this.itemLinkClick = function(a, b) {
            var c = $(a.target).closest(this.attr.itemLinkSelector),
                d = {
                    url: c.attr("data-expanded-url") || c.attr("href"),
                    tcoUrl: c.attr("href"),
                    text: c.text()
                };
            this.trigger("uiItemLinkClick", this.interactionData(a, d))
        }, this.getUserIdFromElement = function(a) {
            return a.length ? a.data("user-id") : null
        }, this.itemSelected = function(a, b) {
            var c = this.getCardDataFromTweet($(a.target));
            b.organicExpansion && this.trigger("uiItemSelected", utils.merge(this.interactionData(a), c))
        }, this.itemDeselected = function(a, b) {
            var c = this.getCardDataFromTweet($(a.target));
            this.trigger("uiItemDeselected", utils.merge(this.interactionData(a), c))
        }, this.isNested = function() {
            return this.$node.closest(this.attr.nestedContainerSelector).length
        }, this.modifierKey = function(a) {
            if (a.shiftKey || a.ctrlKey || a.metaKey) return !0
        }, this.removeTweetsFromUser = function(a, b) {
            var c = this.$node.find("[data-user-id=" + b.userId + "]");
            c.parent().remove(), this.trigger("uiRemovedSomeTweets")
        }, this.after("initialize", function() {
            this.isNested() || (this.on("click", {
                showWithScreenNameSelector: this.showProfilePopupWithScreenName,
                showWithIdSelector: this.showProfilePopupWithId,
                searchtagSelector: this.searchtagClick,
                itemLinkSelector: this.itemLinkClick
            }), this.on("uiHasExpandedTweet", this.itemSelected), this.on("uiHasCollapsedTweet", this.itemDeselected), this.on("uiRemoveTweetsFromUser", this.removeTweetsFromUser))
        })
    }
    var utils = require("core/utils"),
        compose = require("core/compose"),
        withInteractionData = require("app/ui/with_interaction_data"),
        withCardMetadata = require("app/data/with_card_metadata");
    module.exports = withItemActions
});
define("app/ui/with_tweet_translation", ["module", "require", "exports", "core/compose", "app/utils/tweet_helper", "app/ui/with_interaction_data", "core/i18n"], function(module, require, exports) {
    function withTweetTranslation() {
        compose.mixin(this, [withInteractionData]), this.defaultAttrs({
            tweetSelector: "div.tweet",
            tweetTranslationSelector: ".tweet-translation",
            tweetTranslationTextSelector: ".tweet-translation-text",
            translateTweetSelector: "div.tweet ul.js-actions ul.dropdown-menu a.js-translate-tweet"
        }), this.handleTranslateTweetClick = function(a, b) {
            var c, d;
            c = $(a.target).closest(this.attr.tweetSelector), c.find(this.attr.tweetTranslationSelector).is(":hidden") && (d = this.interactionData(c), d.dest = document.documentElement.getAttribute("lang"), this.trigger(c, "uiNeedsTweetTranslation", d))
        }, this.showTweetTranslation = function(a, b) {
            var c;
            if (typeof b.text != "undefined") {
                c = this.findTweetTranslation(b.id_str);
                var d = $("<div>").html(tweetHelper.linkify(b.text));
                this.findTweet(b.id_str).find(".tweet-text a.twitter-timeline-link").each(function(a, b) {
                    var c = $(b);
                    d.find('a.twitter-timeline-link[href="' + c.attr("href") + '"]').html(c.html())
                }), c.find(this.attr.tweetTranslationTextSelector).html(d.html()), c.show()
            }
        }, this.findTweetTranslation = function(a) {
            var b = this.$node.find(this.attr.tweetSelector + "[data-tweet-id=" + a + "]");
            return b.find(this.attr.tweetTranslationSelector)
        }, this.showError = function(a, b) {
            this.trigger("uiShowError", {
                message: _('Unable to translate this Tweet. Please try again later.')
            })
        }, this.after("initialize", function(a) {
            this.on(document, "dataTweetTranslationSuccess", this.showTweetTranslation), this.on(document, "dataTweetTranslationError", this.showError), this.on("click", {
                translateTweetSelector: this.handleTranslateTweetClick
            })
        })
    }
    var compose = require("core/compose"),
        tweetHelper = require("app/utils/tweet_helper"),
        withInteractionData = require("app/ui/with_interaction_data"),
        _ = require("core/i18n");
    module.exports = withTweetTranslation
});
define("app/ui/tweets", ["module", "require", "exports", "core/component", "app/ui/with_tweet_actions", "app/ui/with_user_actions", "app/ui/gallery/with_gallery", "app/ui/with_item_actions", "app/ui/with_tweet_translation"], function(module, require, exports) {
    var defineComponent = require("core/component"),
        withTweetActions = require("app/ui/with_tweet_actions"),
        withUserActions = require("app/ui/with_user_actions"),
        withGallery = require("app/ui/gallery/with_gallery"),
        withItemActions = require("app/ui/with_item_actions"),
        withTweetTranslation = require("app/ui/with_tweet_translation");
    module.exports = defineComponent(withUserActions, withTweetActions, withGallery, withItemActions, withTweetTranslation)
});
define("app/ui/tweet_injector", ["module", "require", "exports", "core/component"], function(module, require, exports) {
    function tweetInjector() {
        this.defaultAttrs({
            tweetsSelector: ".tweets-wrapper"
        }), this.insertTweet = function(a, b) {
            this.$node.removeClass("hidden"), this.$tweets.closest(".permalink").addClass("has-replies"), this.attr.guard(b) && (this.$tweets.append(b.tweet_html), this.trigger("uiTweetInserted", b))
        }, this.after("initialize", function() {
            this.$tweets = this.select("tweetsSelector"), this.on(document, "dataTweetSuccess", this.insertTweet)
        })
    }
    var defineComponent = require("core/component");
    module.exports = defineComponent(tweetInjector)
});
define("app/ui/expando/with_expanding_social_activity", ["module", "require", "exports", "app/ui/expando/expando_helpers", "core/i18n", "app/utils/tweet_helper", "app/ui/tweets", "app/ui/tweet_injector"], function(module, require, exports) {
    function withExpandingSocialActivity() {
        this.defaultAttrs({
            animating: "animating",
            ancestorsSelector: ".js-tweet-ancestors",
            socialProofSelector: ".js-tweet-stats-container",
            requestRetweetedSelector: ".request-retweeted-popup",
            requestFavoritedSelector: ".request-favorited-popup",
            targetTweetSelector: ".tweet",
            tweetsWrapperSelector: ".tweets-wrapper",
            targetTitleSelector: "[data-activity-popup-title]",
            repliesToSelector: ".replies-to",
            inlineReplyTweetBoxFormSelector: ".inline-reply-tweetbox .tweet-form",
            inlineReplyTweetBoxFormCloneSrcSelector: "#inline-reply-tweetbox .tweet-form",
            inlineReplyTweetboxSelector: ".inline-reply-tweetbox",
            inlineReplyUserImageSelector: ".inline-reply-user-image",
            permalinkTweetClasses: "opened-tweet permalink-tweet",
            hiddenClass: "hidden"
        }), this.animateConversationEntrance = function(a, b) {
            var c = a.$container;
            c.addClass(this.attr.animating);
            var d = expandoHelpers.getNaturalHeight(a.$ancestors),
                e = expandoHelpers.getNaturalHeight(a.$descendants),
                f = expandoHelpers.guessGoodSpeed(d, e);
            !a.open && !a.animating && (f = 0), this.animateConversationPiece(a.$ancestors, c, d, f), this.animateConversationPiece(a.$descendants, c, e, f, b)
        }, this.animateConversationPiece = function(a, b, c, d, e) {
            a.data("height", c).animate({
                height: c
            }, {
                duration: d,
                complete: function() {
                    b.removeClass(this.attr.animating), a.height("auto"), this.trigger(a, "uiHasInjectedTimelineItem"), e && e()
                }.bind(this)
            })
        }, this.initTweetsInConversation = function(a) {
            a.$ancestors.length && Tweets.attachTo(a.$ancestors, {
                screenName: this.attr.screenName,
                loggedIn: this.attr.loggedIn,
                itemType: this.attr.itemType,
                eventData: {
                    scribeContext: {
                        component: "in_reply_to"
                    }
                }
            });
            var b = a.$descendants.find(this.attr.repliesToSelector);
            if (a.$descendants) {
                Tweets.attachTo(b, {
                    screenName: this.attr.screenName,
                    loggedIn: this.attr.loggedIn,
                    itemType: this.attr.itemType,
                    eventData: {
                        scribeContext: {
                            component: "replies"
                        }
                    }
                });
                if (this.attr.loggedIn) {
                    var c = a.$tweet.attr("data-tweet-id");
                    TweetInjector.attachTo(b, {
                        guard: function(a) {
                            return a.in_reply_to_status_id == c
                        }
                    })
                }
            }
        }, this.renderConversation = function(a, b) {
            var c = $(a.target).data("expando"),
                d = $(a.target).attr("focus-reply");
            $(a.target).attr("focus-reply", !1);
            if (c.conversationLoaded) return;
            c.conversationLoaded = !0, c.$tweet.data("is-reply-to") || (b.ancestors = ""), c.$ancestors = $(b.ancestors).height(0), c.$descendants = $(b.descendants).height(0);
            var e = c.$descendants.find(this.attr.repliesToSelector);
            c.$descendants.find(this.attr.tweetsWrapperSelector).children().length == 0 && e.addClass(this.attr.hiddenClass), c.$container.prepend(c.$ancestors), c.$scaffold.append(c.$descendants);
            var f = this.renderInlineTweetbox(c, b.sourceEventData);
            this.animateConversationEntrance(c, function() {
                d && f && this.trigger(f, "uiExpandFocus")
            }.bind(this)), this.initTweetsInConversation(c)
        }, this.renderInlineTweetbox = function(a, b) {
            var c, d = a.$descendants.find(this.attr.inlineReplyTweetBoxFormSelector);
            d.length === 0 && (d = $(this.attr.inlineReplyTweetBoxFormCloneSrcSelector).clone(), c = "tweet-box-reply-to-" + a.$tweet.attr("data-tweet-id"), d.find("textarea").attr("id", c), d.find("label").attr("for", c), a.$descendants.find(this.attr.inlineReplyTweetboxSelector).empty(), d.appendTo(a.$descendants.find(this.attr.inlineReplyTweetboxSelector)));
            var e = a.$descendants.find(this.attr.inlineReplyUserImageSelector);
            d.on("uiTweetBoxExpanded", this.showAvatar.bind(e)), d.on("uiTweetBoxCondensed", this.hideAvatar.bind(e));
            var f = tweetHelper.extractMentionsForReply(a.$tweet, this.attr.screenName),
                g = "@" + f.join(" @") + " ";
            b = b || {};
            var h = {
                condensable: !0,
                defaultText: g,
                condensedText: _('Reply to {{screen_names}}', {
                    screen_names: g
                }),
                inReplyToTweetData: b,
                inReplyToStatusId: a.$tweet.attr("data-tweet-id"),
                impressionId: a.$tweet.attr("data-impression-id"),
                disclosureType: a.$tweet.attr("data-disclosure-type"),
                eventData: {
                    scribeContext: {
                        component: "tweet_box_inline_reply"
                    }
                }
            };
            return b.itemType && (h.itemType = b.itemType), this.trigger(d, "uiInitTweetbox", h), d
        }, this.renderEmptyConversation = function(a, b) {
            this.renderConversation(a)
        }, this.showAvatar = function() {
            this.show()
        }, this.hideAvatar = function() {
            this.hide()
        }, this.requestActivityPopup = function(a) {
            var b = $(a.target),
                c = b.closest(this.attr.targetTweetSelector),
                d = !! b.closest(this.attr.requestRetweetedSelector).length;
            a.preventDefault(), a.stopPropagation(), this.trigger("uiRequestActivityPopup", {
                titleHtml: b.closest(this.attr.targetTitleSelector).attr("data-activity-popup-title"),
                tweetHtml: $("<div>").html(c.clone().removeClass(this.attr.permalinkTweetClasses)).html(),
                isRetweeted: d
            })
        }, this.renderSocialProof = function(a, b) {
            var c = $(a.target).find(this.attr.socialProofSelector);
            c.find(".stats").length || c.append(b.social_proof), $(a.target).trigger("uiHasRenderedTweetSocialProof")
        }, this.after("initialize", function() {
            this.on(document, "dataTweetConversationResult", this.renderConversation), this.on(document, "dataTweetSocialProofResult", this.renderSocialProof), this.on("click", {
                requestRetweetedSelector: this.requestActivityPopup,
                requestFavoritedSelector: this.requestActivityPopup
            })
        })
    }
    var expandoHelpers = require("app/ui/expando/expando_helpers"),
        _ = require("core/i18n"),
        tweetHelper = require("app/utils/tweet_helper"),
        Tweets = require("app/ui/tweets"),
        TweetInjector = require("app/ui/tweet_injector");
    module.exports = withExpandingSocialActivity
});
define("app/utils/caret", ["module", "require", "exports"], function(module, require, exports) {
    var caret = {
        getPosition: function(a) {
            try {
                if (document.selection) {
                    var b = document.selection.createRange();
                    return b.moveStart("character", -a.value.length), b.text.length
                }
                if (typeof a.selectionStart == "number") return a.selectionStart
            } catch (c) {}
            return 0
        },
        setPosition: function(a, b) {
            try {
                if (document.selection) {
                    var c = a.createTextRange();
                    c.collapse(!0), c.moveEnd("character", b), c.moveStart("character", b), c.select()
                } else typeof a.selectionStart == "number" && (a.selectionStart = b, a.selectionEnd = b)
            } catch (d) {}
        },
        getSelection: function() {
            return window.getSelection ? window.getSelection().toString() : document.selection.createRange().text
        }
    };
    module.exports = caret
});
define("app/ui/expando/expanding_tweets", ["module", "require", "exports", "core/component", "core/utils", "app/ui/expando/with_expanding_containers", "app/ui/expando/with_expanding_social_activity", "app/ui/expando/expando_helpers", "app/utils/caret"], function(module, require, exports) {
    function expandingTweets() {
        this.defaultAttrs({
            playerCardIframeSelector: ".cards-base.cards-multimedia iframe",
            insideProxyTweet: ".proxy-tweet-container *",
            expandingTweetSelector: ".js-stream-tweet",
            topLevelTweetSelector: ".js-stream-tweet.original-tweet",
            openedTweetSelector: ".opened-tweet",
            detailsSelector: ".js-tweet-details-dropdown",
            expansionSelector: ".expansion-container",
            expandedContentSelector: ".expanded-content",
            expansionClasses: "expansion-container js-expansion-container",
            openedTweetClass: "opened-tweet",
            originalTweetClass: "original-tweet",
            withSocialProofClass: "with-social-proof",
            expandoHandleSelector: ".js-open-close-tweet span",
            containingItemSelector: "li.js-stream-item",
            preexpandedOpenTweetSelector: "li.js-preexpanded div.opened-tweet",
            preexpandedTweetClass: "preexpanded",
            preexpandedTweetSelector: ".js-preexpanded",
            expandedIframeDataStash: "data-expando-iframe-media-url",
            jsLinkSelector: ".js-link",
            pageContainer: "#page-container",
            tweetFormSelector: ".tweet-form",
            withheldTweetClass: "withheld-tweet",
            jsDetailsSelector: ".js-details",
            jsStreamItemSelector: ".js-stream-item",
            openedOriginalTweetSelector: ".js-original-tweet.opened-tweet",
            inReplyToSelector: ".in-reply-to",
            repliesSelector: ".replies",
            timelineFromCacheClass: "js-timeline-from-cache",
            enableAnimation: !0,
            SCROLL_TOP_OFFSET: 55,
            MAX_PLAYER_WIDTH_IN_PIXELS: 435
        }), this.handleTweetClick = function(a, b) {
            var c = $(b.el);
            this.shouldExpandWhenTargetIs($(a.target), c) && (a.preventDefault(), this.expandTweet(c))
        }, this.shouldExpandWhenTargetIs = function(a, b) {
            var c = b.hasClass(this.attr.withheldTweetClass),
                d = a.is(this.attr.expandoHandleSelector),
                e = a.closest(this.attr.jsDetailsSelector, b).length > 0,
                f = !a.closest("a", b).length && !a.closest("button", b).length && !a.closest(this.attr.jsLinkSelector, b).length;
            return (d || f || e) && !c && !this.selectedText()
        }, this.selectedText = function() {
            return caret.getSelection()
        }, this.resetCard = function(a, b) {
            b = b || a.data("expando") || this.loadTweet(a);
            if (b.auto_expanded) return;
            var c = this;
            a.find(this.attr.playerCardIframeSelector).each(function(a, b) {
                b.setAttribute(c.attr.expandedIframeDataStash, b.src), b.src = ""
            })
        }, this.expandItem = function(a, b) {
            this.expandTweet($(a.target).find(this.attr.topLevelTweetSelector), b)
        }, this.expandTweetByReply = function(a, b) {
            var c = $(a.target);
            c.attr("focus-reply", !0), b.focusReply = !0, this.expandTweet(c, b)
        }, this.focusReplyTweetbox = function(a) {
            var b = a.parent().find(this.attr.tweetFormSelector);
            b.length > 0 && this.trigger(b, "uiExpandFocus")
        }, this.expandTweet = function(a, b) {
            b = b || {};
            var c = a.data("expando") || this.loadTweet(a, b);
            if (c.open) {
                if (b.focusReply) {
                    this.focusReplyTweetbox(a);
                    return
                }
                this.closeTweet(a, c, b)
            } else this.openTweet(a, c, b)
        }, this.collapseTweet = function(a, b) {
            $(b).hasClass(this.attr.openedTweetClass) && this.expandTweet($(b), {
                noAnimation: !0
            })
        }, this.loadTweet = function(a, b) {
            b = b || {};
            var c = b.expando || expandoHelpers.buildExpandoStruct({
                $tweet: a,
                preexpanded: b.preexpanded,
                openedTweetClass: this.attr.openedTweetClass,
                inReplyToSelector: this.attr.inReplyToSelector,
                repliesSelector: this.attr.repliesSelector,
                expansionSelector: this.attr.expansionSelector,
                originalClass: this.attr.originalTweetClass,
                containingSelector: this.attr.containingItemSelector
            });
            a.data("expando", c);
            var d;
            return this.setOriginalHeight(a, c), a.find(this.attr.expandedContentSelector).children().length === 0 || c.preexpanded || c.auto_expanded ? (this.scaffoldForAnimation(a, c), delete b.focusReply, this.loadHtmlFragmentsFromAttributes(a, c, b), this.resizePlayerCards(a)) : (d = utils.merge(b, {
                fullConversation: c.isTopLevel,
                facepileMax: c.isTopLevel ? 7 : 6
            }), this.renderInlineTweetbox(c, d), this.initTweetsInConversation(c)), c
        }, this.setOriginalHeight = function(a, b) {
            a.removeClass(this.attr.openedTweetClass), b.originalHeight = a.outerHeight(), a.addClass(this.attr.openedTweetClass)
        }, this.resizePlayerCard = function(a, b) {
            var c = $(b),
                d = parseFloat(c.attr("width"));
            if (d > this.attr.MAX_PLAYER_WIDTH_IN_PIXELS) {
                var e = parseFloat(c.attr("height")),
                    f = d / e,
                    g = this.attr.MAX_PLAYER_WIDTH_IN_PIXELS / f;
                c.attr("width", this.attr.MAX_PLAYER_WIDTH_IN_PIXELS), c.attr("height", Math.floor(g))
            }
        }, this.resizePlayerCards = function(a) {
            var b = a.find(this.attr.playerCardIframeSelector);
            b.each(this.resizePlayerCard.bind(this))
        }, this.loadPreexpandedTweet = function(a, b) {
            var c = $(b),
                d = this.loadTweet(c, {
                    preexpanded: !0
                });
            this.openTweet(c, d, {
                skipAnimation: !0
            }), this.on(b, "uiHasAddedLegacyMediaIcon", function() {
                this.setOriginalHeight(c, d), this.trigger(b, "uiWantsMediaForTweet", {})
            })
        }, this.openTweet = function(a, b, c) {
            b.isTopLevel && this.enterDetachedState(b.$container, c.skipAnimation), this.beforeOpeningTweet(b);
            if (!this.attr.enableAnimation || c.skipAnimation) return this.afterOpeningTweet(b);
            this.trigger(a, "uiHasExpandedTweet", {
                organicExpansion: !c.focusReply,
                impressionId: a.closest("[data-impression-id]").attr("data-impression-id"),
                disclosureType: a.closest("[data-impression-id]").attr("data-disclosure-type")
            }), this.animateTweetHeight(b.$scaffold, b, {
                to: expandoHelpers.getNaturalHeight(b.$scaffold),
                from: b.originalHeight,
                callback: function() {
                    this.afterOpeningTweet(b), c.focusReply && this.focusReplyTweetbox(a)
                }
            })
        }, this.beforeOpeningTweet = function(a) {
            if (a.$tweet.is(this.attr.insideProxyTweet)) return;
            a.$scaffold.height(a.originalHeight);
            var b = this;
            a.auto_expanded || a.$tweet.find("iframe[" + b.attr.expandedIframeDataStash + "]").each(function(a, c) {
                var d = c.getAttribute(b.attr.expandedIframeDataStash);
                !d || (c.src = d)
            }), a.$tweet.addClass(this.attr.openedTweetClass), a.animating = !0, a.$container.addClass(this.attr.animating)
        }, this.afterOpeningTweet = function(a) {
            if (a.$tweet.is(this.attr.insideProxyTweet)) return;
            a.animating = !1, a.open = !0, a.$scaffold.add(a.$ancestors).height("auto"), a.$container.removeClass(this.attr.preexpandedTweetClass).removeClass(this.attr.animating)
        }, this.closeTweet = function(a, b, c) {
            b.isTopLevel && this.exitDetachedState(b.$container, c.noAnimation), b.$container.addClass(this.attr.animating), this.animateTweetHeight(b.$scaffold, b, {
                noAnimation: c.noAnimation,
                to: b.originalHeight,
                from: b.$scaffold.height(),
                adjustScrolling: !0,
                callback: function() {
                    this.resetCard(a, b), b.open = !1, b.$scaffold.height("auto"), b.$container.removeClass(this.attr.animating), a.removeClass(this.attr.openedTweetClass), this.trigger(a, "uiHasCollapsedTweet"), b.isTopLevel && setTimeout(function() {
                        this.closeAllChildTweets(b)
                    }.bind(this), 0)
                }
            })
        }, this.animateTweetHeight = function(a, b, c) {
            var d = Math.abs(c.from - c.to),
                e = Math.min(c.from, c.to),
                f = a.height(),
                g = b.$container.height() - f,
                h = expandoHelpers.guessGoodSpeed(c.to, f, g);
            c.noAnimation && (h = 0);
            var i = b.$container.offset().top,
                j = this.$window.scrollTop(),
                k = j + this.attr.SCROLL_TOP_OFFSET - i;
            if (b.$ancestors) var l = expandoHelpers.getNaturalHeight(b.$ancestors);
            var m = function(a) {
                var f = a - e,
                    g = f / d;
                b.$ancestors && b.$ancestors.height(l * g), c.adjustScrolling && k > 0 && this.$window.scrollTop(j - k * (1 - g))
            };
            a.animate({
                height: c.to
            }, {
                step: m.bind(this),
                duration: h,
                complete: c.callback && c.callback.bind(this)
            })
        }, this.loadHtmlFragmentsFromAttributes = function(a, b, c) {
            a.find(this.attr.detailsSelector).append($(a.data("expanded-footer"))), this.trigger(a, "uiWantsMediaForTweet");
            var d = utils.merge(c, {
                fullConversation: b.isTopLevel && !b.preexpanded,
                facepileMax: b.isTopLevel ? 7 : 6
            });
            b.isTopLevel && b.preexpanded && a.attr("data-use-reply-dialog", "true"), delete d.expando, this.trigger(a, "uiNeedsTweetExpandedContent", d)
        }, this.scaffoldForAnimation = function(a, b) {
            if (!this.attr.enableAnimation) return;
            b.originalHeight = b.originalHeight || a.outerHeight();
            var c;
            a.hasClass("focus") && (c = document.activeElement), a.wrap($("<div/>", {
                "class": this.attr.expansionClasses,
                height: a.outerHeight()
            })), c && c.focus(), b.$scaffold = a.parent()
        }, this.indicateSocialProof = function(a, b) {
            var c = $(a.target);
            if (b.social_proof) {
                var c = $(a.target);
                c.addClass(this.attr.withSocialProofClass)
            }
        }, this.closeAllChildTweets = function(a) {
            a.$ancestors.add(a.$descendants).find(this.attr.openedTweetSelector).each(this.collapseTweet.bind(this))
        }, this.closeAllTopLevelTweets = function() {
            expandoHelpers.closeAllButPreserveScroll({
                $scope: this.$node,
                openSelector: this.attr.openedOriginalTweetSelector,
                itemSelector: this.attr.jsStreamItemSelector,
                callback: this.collapseTweet.bind(this)
            })
        }, this.fullyLoadPreexpandedTweets = function() {
            this.select("preexpandedOpenTweetSelector").each(this.loadPreexpandedTweet.bind(this))
        }, this.removeOpenClassesFromTweets = function(a, b) {
            this.select("openedOriginalTweetSelector").each(function(a, b) {
                var c = $(b);
                c.closest(this.attr.preexpandedTweetSelector).length === 0 && (c.hasClass(this.attr.originalTweetClass) && this.exitDetachedState(c.closest(this.attr.containingItemSelector), {
                    noAnimation: !0
                }), c.removeClass(this.attr.openedTweetClass))
            }.bind(this))
        }, this.after("initialize", function(a) {
            this.$window = $(window), this.on("dataTweetSocialProofResult", this.indicateSocialProof), this.on("uiShouldToggleExpandedState", this.expandItem), this.on("click", {
                expandingTweetSelector: this.handleTweetClick
            }), this.on("expandTweetByReply", this.expandTweetByReply), this.on("uiWantsToCloseAllTweets", this.closeAllTopLevelTweets), this.on(document, "uiSwiftLoaded uiPageChanged uiHasInjectedNewTimeline", this.fullyLoadPreexpandedTweets), this.$node.hasClass(this.attr.timelineFromCacheClass) ? this.on(document, "uiPageChanged", this.removeOpenClassesFromTweets) : this.$node.addClass(this.attr.timelineFromCacheClass)
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        withExpandingContainers = require("app/ui/expando/with_expanding_containers"),
        withExpandingSocialActivity = require("app/ui/expando/with_expanding_social_activity"),
        expandoHelpers = require("app/ui/expando/expando_helpers"),
        caret = require("app/utils/caret");
    module.exports = defineComponent(expandingTweets, withExpandingContainers, withExpandingSocialActivity)
});
define("app/data/url_resolver", ["module", "require", "exports", "core/component", "app/data/with_data"], function(module, require, exports) {
    function urlResolver() {
        this.resolveLink = function(a, b) {
            clearTimeout(this.batch);
            var c = this.linksToResolve[b.url];
            c = c || [], c.push(a.target), this.linksToResolve[b.url] = c, this.batch = setTimeout(this.sendBatchRequest.bind(this), 0)
        }, this.sendBatchRequest = function() {
            var a = Object.keys(this.linksToResolve);
            if (a.length === 0) return;
            this.get({
                data: {
                    urls: a
                },
                eventData: {},
                url: "/i/resolve.json",
                headers: {
                    "X-PHX": !0
                },
                type: "JSON",
                success: this.handleBatch.bind(this),
                error: "dataBatchRequestError"
            })
        }, this.handleBatch = function(a) {
            delete a.sourceEventData, Object.keys(a).forEach(function(b) {
                this.linksToResolve[b] && this.linksToResolve[b].forEach(function(c) {
                    this.trigger(c, "dataDidResolveUrl", {
                        url: a[b]
                    })
                }, this), delete this.linksToResolve[b]
            }, this)
        }, this.after("initialize", function() {
            this.linksToResolve = {}, this.on("uiWantsLinkResolution", this.resolveLink)
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data"),
        UrlResolver = defineComponent(urlResolver, withData);
    module.exports = UrlResolver
});
provide("app/ui/media/phoenix_shim", function(a) {
    using("core/parameterize", "core/utils", function(b, c) {
        var d = {}, e = {}, f = [],
            g = {
                send: function() {
                    throw Error("you have to define sandboxedAjax.send")
                }
            }, h = function(a, b) {
                return b = b || "", typeof a != "string" && (a.global && (b += "g"), a.ignoreCase && (b += "i"), a.multiline && (b += "m"), a = a.source), new RegExp(a.replace(/#\{(\w+)\}/g, function(a, b) {
                    var c = e[b] || "";
                    return typeof c != "string" && (c = c.source), c
                }), b)
            }, i = {
                media: {
                    types: {}
                },
                bind: function(a, b, c) {
                    return function() {
                        return b.apply(a, c ? c.concat(Array.prototype.slice.apply(arguments)) : arguments)
                    }
                },
                each: function(a, b, c) {
                    for (var d = 0, e = a.length; d < e; ++d) c ? b.call(c, a[d], d, a) : b(a[d], d, a)
                },
                merge: function() {
                    var a = $.makeArray(arguments);
                    return a.length === 1 ? a[0] : (typeof a[a.length - 1] == "boolean" && a.unshift(a.pop()), $.extend.apply(null, a))
                },
                proto: location.protocol.slice(0, -1),
                provide: function(_, a) {
                    e = a
                },
                isSSL: function() {},
                mediaType: function(a, b) {
                    d[a] = b, b.title || (d[a].title = a);
                    for (var e in b.matchers) {
                        var g = h(b.matchers[e]);
                        b.matchers[e] = g, b._name = a, f.push([g, a, e])
                    }
                    return i.media.types[a] = {
                        matchers: b.matchers
                    }, {
                        statics: function(b) {
                            return d[a].statics = b, d[a] = c.merge(d[a], b), i.media.types[a].templates = b.templates, this
                        },
                        methods: function(b) {
                            return d[a].methods = b, d[a] = c.merge(d[a], b), this
                        }
                    }
                },
                constants: {
                    imageSizes: {
                        small: "small",
                        medium: "medium",
                        large: "large",
                        original: "original"
                    }
                },
                helpers: {
                    truncate: function(a, b, c) {
                        return a.slice(0, b) + c
                    }
                },
                util: {
                    joinPath: function(a, b) {
                        var c = a.substr(-1) === "/" ? "" : "/";
                        return a + c + b
                    },
                    supplant: function(a, c) {
                        return b(a.replace(/\{/g, "{{").replace(/\}/g, "}}"), c)
                    },
                    paramsFromUrl: function(a) {
                        if (!a || a.indexOf("?") < 0) return null;
                        var b = {};
                        return a.slice(1).split("&").forEach(function(a) {
                            var c = a.split("=");
                            b[c[0]] = c[1]
                        }), b
                    }
                },
                sandboxedAjax: g
            };
        a({
            Mustache: {
                to_html: b
            },
            twttr: i,
            mediaTypes: d,
            matchers: f,
            sandboxedAjax: g
        })
    })
})
provide("app/ui/media/types", function(a) {
    using("app/ui/media/phoenix_shim", function(b) {
        function e(a) {
            return c.isSSL() ? a.replace(/^http:/, "https:") : a
        }
        var c = phx = b.twttr,
            d = b.Mustache;
        c.provide("twttr.regexps", {
            protocol: /(?:https?\:\/\/)/,
            protocol_no_ssl: /(?:http\:\/\/)/,
            optional_protocol: /(?:(?:https?\:\/\/)?(?:www\.)?)/,
            protocol_subdomain: /(?:(?:https?\:\/\/)?(?:[\w\-]+\.))/,
            optional_protocol_subdomain: /(?:(?:https?\:\/\/)?(?:[\w\-]+\.)?)/,
            wildcard: /[a-zA-Z0-9_#\.\-\?\&\=\/]+/,
            itunes_protocol: /(?:https?\:\/\/)?(?:[a-z]\.)?itunes\.apple\.com(?:\/[a-z][a-z])?/
        }), c.mediaType("Twitter", {
            icon: "tweet",
            domain: "//twitter.com",
            ssl: !0,
            skipAttributionInDiscovery: !0,
            matchers: {
                permalink: /^#{optional_protocol}?twitter\.com\/(?:#!?\/)?\w{1,20}\/status\/(\d+)[\/]?$/i
            },
            process: function(a) {
                var b = this;
                using("app/utils/twt", function(d) {
                    if (!d) return;
                    d.settings.lang = $("html").attr("lang"), c.sandboxedAjax.send({
                        url: "//api.twitter.com/1/statuses/show.json",
                        dataType: "jsonp",
                        data: {
                            include_entities: !0,
                            contributor_details: !0,
                            id: b.slug
                        },
                        success: function(c) {
                            b.tweetHtml = d.tweet(c).html(), a()
                        }
                    })
                })
            },
            render: function(a) {
                $(a).append("<div class='tweet-embed'>" + this.tweetHtml + "</div>")
            }
        }), c.mediaType("Youtube", {
            title: "YouTube",
            icon: "video",
            domain: "//www.youtube.com",
            ssl: !0,
            flaggable: !0,
            height: 312,
            matchers: {
                tinyUrl: /^#{optional_protocol}?youtu\.be\/([a-zA-Z0-9_\-\?\&\=\/]+)/i,
                standardUrl: /^#{optional_protocol}?youtube\.com\/watch[a-zA-Z0-9_\-\?\&\=\/]+/i
            },
            process: function(a, b) {
                var c = 30;
                this.data.width = b && b.maxwidth || 390, this.data.height = b && b.maxwidth ? this.calcHeight(b.maxwidth) + 30 : 307;
                var d = this.url.match(this.constructor.matchers.tinyUrl),
                    e = this.url.match(/[\?\&]v\=([\w\-]+)(?:\&|$)/);
                d ? (this.data.id = d[1], a()) : e && (this.data.id = e[1], a())
            },
            metadata: function(a) {
                var b = {
                    image: phx.util.supplant("//img.youtube.com/vi/{id}/0.jpg", this.data)
                };
                a(b)
            },
            getImageURL: function(a, b) {
                var c = this;
                this.process(function() {
                    c.metadata(function(a) {
                        a && a.image ? b(a.image) : b(null)
                    })
                })
            },
            render: function(a) {
                this.renderIframe(a, c.proto + "://www.youtube.com/embed/" + this.data.id + "?wmode=opaque")
            }
        }), c.mediaType("Ustream", {
            icon: "video",
            domain: "http://ustream.tv",
            ssl: !1,
            flaggable: !0,
            matchers: {
                recorded: /^#{optional_protocol}?ustream\.tv\/(recorded\/(?:\d+))/i,
                channel: /^#{optional_protocol}?ustream\.tv\/(channel\/(?:[\w\-]+)\/?)/i
            },
            metadata: function(a) {
                var b = null;
                this.data && this.data.imageUrl && this.data.imageUrl.small && (b = this.data.imageUrl.small), a({
                    title: this.data.title,
                    description: this.data.description ? c.helpers.truncate(this.data.description, 255, "...") : "",
                    image: b
                })
            },
            getImageURL: function(a, b) {
                var c = this;
                this.process(function() {
                    c.metadata(function(a) {
                        b(a.image)
                    })
                })
            },
            process: function(a, b) {
                var d = this;
                this.data.width = b && b.maxwidth || 390, this.data.height = this.calcHeight(this.data.width), (this.slug.match(this.constructor.re.channel) || this.slug.match(this.constructor.re.video)) && c.sandboxedAjax.send({
                    url: "http://api.ustream.tv/json/channel/" + RegExp.$1 + "/getInfo",
                    dataType: "jsonp",
                    data: {
                        key: this.constructor.API_KEY,
                        maxwidth: this.data.width
                    },
                    success: function(b) {
                        b !== null && (d.data.type = "channel", d.data.embed = d.useOpaqueModeForFlash(b.embedTag), d.data.imageUrl = b.imageUrl), a()
                    }
                })
            },
            content: function() {
                return this.data.type === "channel" ? this.data.embed : d.to_html(this.constructor.templates[this.data.type], this.data)
            }
        }).statics({
            API_KEY: "12ab548e85128e0d3182ba3a346c3428",
            re: {
                video: /^recorded\/(\d+)/,
                channel: /^channel\/([\w\-]+)\/?/
            },
            templates: {
                video: '        <object width="{{width}}" height="{{height}}">          <param name="flashvars" value="autoplay=false&amp;vid={{videoId}}&amp;"/>          <param name="allowfullscreen" value="true"/>          <param name="allowscriptaccess" value="always"/>          <param name="wmode" value="opaque"/>          <param name="src" value="http://www.ustream.tv/flash/video/{{videoId}}"/>          <embed            flashvars="loc=%2F&amp;autoplay=false&amp;vid={{videoId}}&amp;"            width="{{width}}"            height="{{height}}"            allowfullscreen="true"            allowscriptaccess="always"            wmode="opaque"            src="http://www.ustream.tv/flash/video/{{videoId}}"            type="application/x-shockwave-flash" />        </object>'
            }
        }), c.mediaType("Vevo", {
            icon: "video",
            domain: "http://vevo.com",
            ssl: !1,
            flaggable: !0,
            matchers: {
                standardVideo: /^#{optional_protocol}?vevo\.com\/watch\/[\w-]+\/[\w-]+\/([a-zA-Z0-9_]+)/i
            },
            process: function(a, b) {
                this.data.id = this.slug, this.data.width = b && b.maxwidth || 390, this.data.height = this.calcHeight(this.data.width), a()
            },
            content: function() {
                var a = '<object width="{{width}}" height="{{height}}">                <param name="movie" value="http://www.vevo.com/VideoPlayer/Embedded?videoId={{id}}&playlist=false&autoplay=0&playerId=62FF0A5C-0D9E-4AC1-AF04-1D9E97EE3961&playerType=embedded"/>                <param name="bgcolor" value="#000000"/>                <param name="allowFullScreen" value="true"/>                <param name="allowScriptAccess" value="always"/>                <param name="wmode" value="opaque"/>                <embed                  src="http://www.vevo.com/VideoPlayer/Embedded?videoId={{id}}&playlist=false&autoplay=0&playerId=62FF0A5C-0D9E-4AC1-AF04-1D9E97EE3961&playerType=embedded"                   type="application/x-shockwave-flash"                   allowfullscreen="true"                   allowscriptaccess="always"                   wmode="opaque"                   width="{{width}}"                   height="{{height}}"                   bgcolor="#000000" />              </object>';
                return d.to_html(a, this.data)
            }
        }), c.mediaType("Flickr", {
            icon: "photo",
            favicon: c.isSSL() ? "https://secure.flickr.com/favicon.ico" : "http://www.flickr.com/favicon.ico",
            domain: c.isSSL() ? "https://secure.flickr.com" : "http://www.flickr.com",
            deciderKey: "phoenix_flickr_details",
            flaggable: !0,
            matchers: {
                profile: /^#{optional_protocol}?flickr\.com\/(?:photos|people)\/([\w\@\-]+)\/?$/i,
                photo: /^#{optional_protocol}?flickr\.com\/photos\/[\w\@\-]+\/(\d+)\/?/i,
                sets: /^#{optional_protocol}?flickr\.com\/photos\/(?:[\w\@\-]+)\/sets\/(\d+)\/?(?:show\/?)?$/i,
                galleries: /^#{optional_protocol}?flickr\.com\/photos\/([\w\@\-]+)\/galleries\/(\d+)\/?$/i,
                pool: /^#{optional_protocol}?flickr\.com\/groups\/([\w\@\-]+)\/?(?:pool\/|discuss\/)?$/i
            },
            ssl: !0,
            metadata: function(a) {
                var b;
                this.data.photos && this.data.photos.length >= 1 ? (b = this.data.photos[0], a({
                    image: d.to_html("//farm{{farm}}.static.flickr.com/{{server}}/{{id}}_{{secret}}.jpg", b),
                    title: this.data.title,
                    description: this.data.description,
                    author: {
                        name: this.data.author_name,
                        url: this.data.author_url
                    }
                })) : a(null)
            },
            getImageURL: function(a, b) {
                var c = this;
                this.process(function() {
                    c.metadata(function(a) {
                        a && a.image ? b(a.image) : b(null)
                    })
                })
            },
            process: function(a, b) {
                this.data.width = b && b.maxwidth || 390, this.data.height = this.calcHeight(this.data.width), this.data.domain = this.constructor.domain;
                var d = c.media.types.Flickr.matchers,
                    e = this,
                    f = this.url;
                if (f.match(d.photo)) {
                    var g = RegExp.$1;
                    this.makeRequest({
                        data: {
                            method: "flickr.photos.getInfo",
                            photo_id: g
                        },
                        success: function(b) {
                            b.photo && (e.data.author_name = b.photo.owner.realname, e.data.author_url = e.constructor.domain + "/photos/" + b.photo.owner.nsid, b.photo.media && b.photo.media == "video" && (e.data.isVideo = !0), e.data.photos = [b.photo]), a()
                        }
                    })
                } else f.match(d.sets) ? this._makeSetRequest(RegExp.$1, a) : f.match(d.profile) ? this.lookUpUserPhotos(RegExp.$1, this.slug, a) : f.match(d.pool) ? this._makeGroupRequestByName(RegExp.$1, a) : f.match(d.galleries) && this.makeRequest({
                    data: {
                        method: "flickr.urls.lookupGallery",
                        url: "flickr.com/photos/" + RegExp.$1 + "/galleries/" + RegExp.$2
                    },
                    success: function(b) {
                        var c = b.gallery.id;
                        e.makeRequest({
                            data: {
                                method: "flickr.galleries.getPhotos",
                                gallery_id: c
                            },
                            success: function(b) {
                                e.data.photos = b.photos.photo.slice(0, 16), e.data.isGallery = 1, a()
                            }
                        })
                    }
                });
                return
            },
            content: function() {
                var a = "",
                    b = c.media.types.Flickr;
                if (this.data.photos.length == 1) if (this.data.isVideo) {
                    var e = this.data.photos[0];
                    e.domain = this.data.domain, a += d.to_html(b.templates.video, e)
                } else this.data.photos[0].href = this.data.photos[0].urls.url[0]._content, a += d.to_html(b.templates.photo, this.data.photos[0]);
                else {
                    a = '<div class="flickr-group">' + this.createThumbList(this.data.photos) + "</div>";
                    if (this.data.isGallery) return a;
                    var f;
                    this.data.set_id ? f = b.photoSetFlashVars : this.data.group_id ? f = b.photoGroupFlashVars : f = b.photoUserFlashVars, f = c.merge({}, b.defaultSlideshowFlashVars, f, !0);
                    var g = [];
                    $.each(f, function(a, b) {
                        g.push(a + "=" + b)
                    }), g = d.to_html(g.join("&"), this.data), a += d.to_html(b.templates.slideshow, {
                        flashvars: g,
                        domain: this.data.domain
                    })
                }
                return a
            }
        }).statics({
            API_KEY: "2a56884b56a00758525eaa2fee16a798",
            SECRET: "7c794fe3256175b6",
            REST_DOMAIN: "//widgets.platform.twitter.com",
            defaultSlideshowFlashVars: {
                lang: "en-us",
                offsite: !0,
                minH: 100,
                minW: 100
            },
            templates: {
                video: '<object width="{{width}}" height="{{height}}"                   type="application/x-shockwave-flash"                   data="{{domain}}/apps/video/stewart.swf?v=71377"                   classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">                   <param name="flashvars" value="intl_lang=en-us&photo_secret={{secret}}&photo_id={{id}}"/>                   <param name="movie" value="{{domain}}/apps/video/stewart.swf?v=71377"/>                   <param name="bgcolor" value="#000000"/>                   <param name="allowFullScreen" value="true"/>                   <param name="wmode" value="opaque"/>                   <embed                     type="application/x-shockwave-flash"                     src="{{domain}}/apps/video/stewart.swf?v=71377"                     bgcolor="#000000"                     allowfullscreen="true"                     wmode="opaque"                     flashvars="intl_lang=en-us&photo_secret={{secret}}&photo_id={{id}}"                     height="{{height}}"                     width="{{width}}" />                 </object>',
                photo: '<div class="flickr-photo">                   <a href="{{href}}" target="_blank">                     <img src="//farm{{farm}}.static.flickr.com/{{server}}/{{id}}_{{secret}}.jpg"/>                   </a>                 </div>',
                set: '<a href="{{href}}" style="text-decoration:none;" target="_blank">                <img class="flickr-thumb" src="//farm{{farm}}.static.flickr.com/{{server}}/{{id}}_{{secret}}_s.jpg"/>              </a>',
                slideshow: '<embed type="application/x-shockwave-flash"                             src="{{domain}}/apps/slideshow/show.swf?v=107931"                             width="{{width}}"                             height="{{height}}"                             id="slideShowMovie"                             bgcolor="#000000"                             quality="high"                             allowfullscreen="true"                             allowscriptaccess="always"                             wmode="opaque"                             flashvars={{flashvars}} />'
            },
            photoUserFlashVars: {
                user_id: "{{user_id}}",
                page_show_back_url: "/photos/{{user_name}}/",
                page_show_url: "/photos/{{user_name}}/show/"
            },
            photoGroupFlashVars: {
                group_id: "{{group_id}}",
                page_show_url: "/groups/{{group_id}}/pool/show/",
                page_show_back_url: "/groups/{{group_id}}/pool/"
            },
            photoSetFlashVars: {
                set_id: "{{set_id}}",
                page_show_back_url: "/photos/{{user_name}}/sets/{{set_id}}/",
                page_show_url: "/photos/{{user_name}}/sets/{{set_id}}/show/"
            }
        }).methods({
            base58: function(a) {
                var b = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ",
                    c = a.length,
                    d = 0,
                    e = 1;
                for (var f = c - 1; f >= 0; f--) d += e * b.indexOf(a[f]), e *= b.length;
                return d
            },
            lookUpUserPhotos: function(a, b, c) {
                var d = this;
                this.makeRequest({
                    data: {
                        method: "flickr.urls.lookupUser",
                        url: "flickr.com/photos/" + a
                    },
                    success: function(b) {
                        if (b.stat === "fail") {
                            c();
                            return
                        }
                        var e = b.user.id,
                            f = b.user.username._content;
                        d.makeRequest({
                            data: {
                                method: "flickr.people.getPublicPhotos",
                                user_id: e
                            },
                            success: function(b) {
                                d.data.photos = b.photos.photo.slice(0, 16), d.data.user_id = e, d.data.user_name = a, d.data.author_name = f, d.data.author_url = d.constructor.domain + "/photos/" + e, c()
                            }
                        })
                    }
                })
            },
            createThumbList: function(a) {
                var b = "http://www.flickr.com/photos",
                    c = this;
                return $.map(a, function(a, e) {
                    return a.href = [b, a.owner, a.id].join("/"), d.to_html(c.constructor.statics.templates.set, a)
                }).join("")
            },
            _makeGroupRequestByName: function(a, b) {
                this.makeRequest({
                    data: {
                        method: "flickr.urls.lookupGroup",
                        url: "flickr.com/groups/" + a
                    },
                    success: c.bind(this, function(a) {
                        this._makeGroupRequestById(a.group.id, b)
                    })
                })
            },
            _makeGroupRequestById: function(a, b) {
                this.makeRequest({
                    data: {
                        method: "flickr.groups.pools.getPhotos",
                        group_id: a
                    },
                    success: c.bind(this, function(c) {
                        this.data.photos = c.photos.photo.slice(0, 16), this.data.group_id = a, b()
                    })
                })
            },
            _makeSetRequest: function(a, b) {
                this.makeRequest({
                    data: {
                        method: "flickr.photosets.getPhotos",
                        photoset_id: a
                    },
                    success: c.bind(this, function(a) {
                        var d = a.photoset.owner;
                        this.data.photos = a.photoset.photo.slice(0, 16), c.each(this.data.photos, function(a) {
                            a.owner = d
                        }), this.data.set_id = a.photoset.id, this.data.user_name = d, this.data.author_name = a.photoset.ownername, this.data.author_url = this.constructor.domain + "/photos/" + a.photoset.owner, b()
                    })
                })
            },
            makeRequest: function(a) {
                var b = {
                    url: this.constructor.statics.REST_DOMAIN + "/services/rest",
                    dataType: "jsonp",
                    jsonp: "jsoncallback",
                    data: {
                        format: "json",
                        api_key: this.constructor.statics.API_KEY
                    },
                    success: function(a) {}
                };
                c.sandboxedAjax.send(c.merge({}, b, a, !0))
            }
        }), c.mediaType("DeviantArt", {
            title: "deviantART",
            icon: "photo",
            domain: "http://deviantart.com",
            flaggable: !0,
            matchers: {
                canonical: /^(#{protocol}?(?:[\w\-]+\.)deviantart\.com\/art\/(?:[\w\@-]+))/i,
                oldStyle: /^(#{protocol}?(?:[\w\-]+\.)deviantart\.com\/deviation\/(?:[\w\@-]+))/i,
                gallery: /^(#{protocol}?(?:[\w\-]+\.)deviantart\.com\/gallery\/#\/d(?:[\w\@-]+))/i,
                favMe: /^(#{protocol}?fav\.me\/(?:[\w\@-]+))/i,
                oldView: /^(#{protocol}?(?:[\w\-]+\.)deviantart\.com\/view\/(?:[\w\@-]+))/i
            },
            process: function(a, b) {
                b = b || {}, c.sandboxedAjax.send({
                    url: "http://backend.deviantart.com/oembed",
                    data: {
                        url: this.slug,
                        format: "jsonp",
                        maxwidth: b.maxwidth
                    },
                    dataType: "jsonp",
                    success: c.bind(this, function(b) {
                        this.data.href = this.url, this.data.name = this.constructor._name, this.data.src = b.thumbnail_url, this.data.author_name = b.author_name, this.data.author_url = b.author_url, a()
                    })
                })
            },
            attribution: function() {
                var a = "         <div class='media-attribution'>           <span>via</span>            <a target='_blank' class='media-attribution-link' href='{{author_url}}'>{{author_name}}</a>            from <img src='{{icon_url}}'/>           <a target='_blank' data-media-type='{{media_type}}' class='media-attribution-link' href='{{url}}'>{{title}}</a>         </div>";
                return d.to_html(a, {
                    url: this.constructor.domain,
                    icon_url: c.assets.path("/partner-favicons/DeviantArt.ico"),
                    title: this.constructor.title || this.constructor._name,
                    media_type: this.constructor._name,
                    author_name: this.data.author_name,
                    author_url: this.data.author_url
                })
            },
            content: function() {
                var a = '<div class="deviantart">                <a class="inline-media-image" data-inline-type="{{name}}" href="{{href}}" target="_blank">                  <img src="{{src}}"/>                </a>              </div>';
                return d.to_html(a, this.data)
            }
        }), c.mediaType("Vimeo", {
            icon: "video",
            domain: "//vimeo.com",
            ssl: !0,
            flaggable: !0,
            height: 150,
            matchers: {
                video: /^#{optional_protocol}?vimeo\.com\/(\d+)/i
            },
            getImageURL: function(a, b) {
                var c = this;
                this.process(function() {
                    c.data && c.data.thumbnail_url ? b(c.data.thumbnail_url) : b(null)
                })
            },
            process: function(a, b) {
                var d = this;
                b = b || {}, this.data.video_id = this.slug, c.sandboxedAjax.send({
                    url: "//vimeo.com/api/oembed.json",
                    dataType: "jsonp",
                    data: {
                        url: "http://vimeo.com/" + this.slug,
                        width: b.maxwidth || 446
                    },
                    success: function(b) {
                        d.data.thumbnail_url = b.thumbnail_url, d.data.width = b.width, d.data.height = b.height, a()
                    }
                })
            },
            render: function(a) {
                this.renderIframe(a, "//player.vimeo.com/video/" + this.data.video_id.replace(/[^0-9]/g, ""))
            }
        }), c.mediaType("Etsy", {
            icon: "photo",
            domain: "http://etsy.com",
            ssl: !1,
            matchers: {
                itemListing: /^#{optional_protocol}?etsy\.com\/listing\/(\d+)/i
            },
            getImageURL: function(a, b) {
                var c = this;
                this.process(function() {
                    c.data && c.data.images && c.data.images.length > 0 ? b(c.data.images[0].url_170x135) : b(null)
                })
            },
            process: function(a, b) {
                var e = this;
                b = b || {}, this.data.itemId = this.slug, this.data.href = this.url, this.data.name = this.constructor._name, c.sandboxedAjax.send({
                    url: "http://openapi.etsy.com/v2/public/listings/" + this.slug + ".js",
                    dataType: "jsonp",
                    data: {
                        detail_level: "high",
                        api_key: "qev732j7b8j44eg5pqsb38k4",
                        includes: "Images(url_170x135):6",
                        fields: "listing_id,title,price,currency_code,quantity",
                        maxwidth: b.maxwidth
                    },
                    success: function(b) {
                        var c = b.results[0];
                        e.data.title = c.title;
                        switch (c.currency_code) {
                            case "USD":
                                e.data.price = c.quantity + " for $" + (c.price || 0);
                                break;
                            default:
                                e.data.price = c.quantity + " for " + (c.price || 0) + " " + c.currency_code
                        }
                        e.data.images = c.Images;
                        var f = $.map(c.Images, function(a, b) {
                            return '<a class="inline-media-image" data-inline-type="{{name}}" target="_blank" href="{{href}}">                      <img class="thumb" src="' + a.url_170x135 + '"/>                    </a>'
                        }).join(""),
                            g = '            <div class="etsy">              <h3>{{title}}</h3>              <p>{{price}}</p>              <p>' + f + "</p>            </div>";
                        e.data.html = d.to_html(g, e.data), a()
                    }
                })
            },
            content: function() {
                return this.data.html
            }
        }), c.mediaType("Photozou", {
            icon: "photo",
            domain: "http://photozou.jp",
            flaggable: !0,
            matchers: {
                photo: /^#{optional_protocol}?photozou\.(?:com|jp)\/photo\/show\/\d+\/(\d+)/i
            },
            ssl: !1,
            getImageURL: function(a, b, c) {
                var d = this;
                this.process(function() {
                    d.data && d.data.src ? c && c < 120 || a == phx.constants.imageSizes.small ? b(d.data.smallSrc) : b(d.data.src) : b(null)
                })
            },
            process: function(a) {
                this.data.src = "http://photozou.jp/p/img/" + this.slug, this.data.smallSrc = "http://photozou.jp/p/thumb/" + this.slug, this.data.href = this.url, this.data.name = this.constructor._name, a()
            },
            content: function() {
                var a = '<div class="photozou">                 <a class="inline-media-image" data-inline-type="{{name}}" href="{{href}}" target="_blank">                   <img src="{{src}}"/>                 </a>               </div>';
                return d.to_html(a, this.data)
            }
        }), c.mediaType("TwitPic", {
            icon: "photo",
            domain: "//twitpic.com",
            flaggable: !0,
            matchers: {
                media: /^#{optional_protocol}?twitpic\.com\/(?!(?:place|photos|events)\/)([a-zA-Z0-9\?\=\-]+)/i
            },
            ssl: !0,
            process: function(a) {
                this.data.src = this.slug, this.data.href = this.url, this.data.name = this.constructor._name, a()
            },
            getImageURL: function(a, b) {
                if (this.slug) {
                    var c = "";
                    a == phx.constants.imageSizes.medium ? c = "//twitpic.com/show/thumb/" + this.slug : a == "small" ? c = "//twitpic.com/show/mini/" + this.slug : c = "//twitpic.com/show/iphone/" + this.slug, b(c)
                } else b(null)
            },
            content: function() {
                var a = '<div class="twitpic">                 <a class="inline-media-image" data-inline-type="{{name}}" href="{{href}}" target="_blank">                   <img src="//twitpic.com/show/large/{{src}}"/>                 </a>              </div>';
                return d.to_html(a, this.data)
            }
        }), c.mediaType("Twitgoo", {
            icon: "photo",
            domain: "http://twitgoo.com",
            ssl: !1,
            flaggable: !0,
            matchers: {
                image: /^#{optional_protocol}?twitgoo\.com\/(?!a\/)([a-zA-Z0-9\-\?\=]+)/i
            },
            getImageURL: function(a, b) {
                this.slug ? b(phx.util.supplant("http://twitgoo.com/{src}/img", {
                    src: this.slug
                })) : b(null)
            },
            process: function(a) {
                this.data.src = this.slug, this.data.href = this.url, this.data.name = this.constructor._name, a()
            },
            content: function() {
                var a = '<div class="twitgoo">                 <a class="inline-media-image" data-inline-type="{{name}}" href="{{href}}" target="_blank">                   <img src="http://twitgoo.com/{{src}}/img"/>                 </a>               </div>';
                return d.to_html(a, this.data)
            }
        }), c.mediaType("DailyBooth", {
            icon: "photo",
            domain: "//dailybooth.com",
            ssl: !0,
            matchers: {
                photo1: /^#{optional_protocol}?dailybooth\.com\/(u\/\w+)/i,
                photo2: /^#{optional_protocol}?dailybooth\.com\/(\w+\/\w+)/i
            },
            getImageURL: function(a, b) {
                var c = this;
                this.process(function() {
                    c.data ? a === phx.constants.imageSizes.original ? b(c.data.src) : b(c.data.smallImage) : b(null)
                })
            },
            process: function(a) {
                var b = this;
                this.data.href = e(this.url), this.data.name = this.constructor._name;
                if (this.slug.match(/^u\/(\w+)/)) var d = parseInt(RegExp.$1, 36),
                    f = this.getBaseTen(d);
                else {
                    var f = this.slug.match(/\w+\/(\w+)/);
                    if (!f) {
                        a();
                        return
                    }
                    f = f[1]
                }
                c.sandboxedAjax.send({
                    url: "//api.dailybooth.com/v1/picture/" + f + ".json",
                    dataType: "jsonp",
                    type: "get",
                    success: function(c) {
                        b.data.src = e(c.urls.large), b.data.smallImage = e(c.urls.small), a()
                    }
                })
            },
            content: function() {
                var a = '<div class="dailybooth">                 <a class="inline-media-image" data-inline-type="{{name}}" href="{{href}}" target="_blank">                   <img src="{{src}}"/>                 </a>               </div>';
                return d.to_html(a, this.data)
            }
        }).methods({
            getBaseTen: function(a) {
                if (Number.prototype.toFixed) a = a.toFixed(5), a = parseFloat(a);
                else {
                    var b = Math.floor(a),
                        c = a - b;
                    a = b + Math.round(c * 1e14) / 1e14
                }
                return a
            }
        }), c.mediaType("YFrog", {
            domain: "//yfrog.com",
            ssl: !0,
            flaggable: !0,
            icon: function(a) {
                var b = this.slug.charAt(this.slug.length - 1);
                switch (b) {
                    case "j":
                    case "p":
                    case "b":
                    case "t":
                    case "g":
                        return "photo";
                    case "z":
                    case "f":
                    case "s":
                        return "video"
                }
            },
            matchers: {
                media: /^#{optional_protocol}?yfrog\.(?:com|ru|com\.tr|it|fr|co\.il|co\.uk|com\.pl|pl|eu|us)\/(\w+)/i
            },
            getImageURL: function(a, b) {
                this.slug ? this.icon() === "video" ? b(phx.util.supplant("//yfrog.com/{id}:frame", {
                    id: this.slug
                })) : a === phx.constants.imageSizes.small ? b(phx.util.supplant("//yfrog.com/{id}:twthumb", {
                    id: this.slug
                })) : b(phx.util.supplant("//yfrog.com/{id}:tw1", {
                    id: this.slug
                })) : b(null)
            },
            process: function(a) {
                this.data.media_id = this.slug, this.data.href = this.url.replace(/\/$/, ""), this.data.name = this.constructor._name, a()
            },
            content: function() {
                var a, b = this.data.media_id.charAt(this.data.media_id.length - 1);
                if (b == "j" || b == "p" || b == "b" || b == "t" || b == "g") a = '<div class="yfrog">               <a class="inline-media-image" data-inline-type="{{name}}" href="{{href}}" target="_blank">                 <img src="//yfrog.com/{{media_id}}:iphone">               </a>             </div>';
                else if (b == "z" || b == "f" || b == "s") a = '<embed                src="//yfrog.com/{{media_id}}:embed"                width="100%"                allowFullScreen="true"                wmode="transparent"                type="application/x-shockwave-flash"/>';
                return a || (a = ""), d.to_html(a, this.data)
            }
        }), c.mediaType("Lockerz", {
            icon: "photo",
            domain: "//www.lockerz.com",
            ssl: !0,
            matchers: {
                tweetphoto: /^#{optional_protocol}?tweetphoto\.com\/(\d+)/i,
                plixi: /^#{protocol}?(?:(?:m|www)\.)?plixi\.com\/p\/(\d+)/i,
                lockerz: /^#{protocol}?(?:(?:m|www)\.)?lockerz\.com\/s\/([0-9\?\=\- ]+)/i
            },
            getImageURL: function(a, b) {
                var c = this;
                this.process(function() {
                    c.data && c.data.src ? b(c.data.src) : b(null)
                })
            },
            process: function(a) {
                this.data.src = "//api.plixi.com/api/tpapi.svc/imagefromurl?size=medium&url=" + encodeURIComponent(this.url), this.data.href = this.url, this.data.name = this.constructor._name, a()
            },
            content: function() {
                var a = '<div class="lockerz">                 <a class="inline-media-image" data-inline-type="{{name}}" href="{{href}}" target="_blank">                   <img src="{{src}}" />                 </a>              </div>';
                return d.to_html(a, this.data)
            },
            flaggable: !0
        }), c.mediaType("Kiva", {
            icon: "generic",
            domain: "http://www.kiva.org",
            ssl: !1,
            matchers: {
                project: /^#{optional_protocol}?kiva\.org\/lend\/(\d+)/i
            },
            process: function(a, b) {
                var d = this;
                b = b || {}, c.sandboxedAjax.send({
                    url: "http://www.kiva.org/services/oembed",
                    dataType: "jsonp",
                    jsonp: "jsonp",
                    data: {
                        url: "http://www.kiva.org/lend/" + this.slug,
                        format: "jsonp",
                        maxwidth: b.maxwidth
                    },
                    success: function(b) {
                        d.data.html = b.html, a()
                    }
                })
            },
            content: function() {
                return this.data.html
            }
        }), c.mediaType("TwitVid", {
            icon: "video",
            domain: "//www.twitvid.com",
            ssl: !0,
            flaggable: !0,
            favicon: "//www.twitvid.com/favicon.ico",
            matchers: {
                video: /^#{optional_protocol}?twitvid\.com\/([a-zA-Z0-9_\-\?\=]+)/i
            },
            process: function(a, b) {
                this.data.media_id = this.slug, this.data.width = b && b.maxwidth || 425, this.data.height = this.calcHeight(this.data.width), a()
            },
            metadata: function(a) {
                a({
                    image: phx.util.supplant("//www.twitvid.com/{media_id}:largethumb", this.data)
                })
            },
            getImageURL: function(a, b) {
                var c = this;
                this.process(function() {
                    c.metadata(function(a) {
                        a && a.image ? b(a.image) : b(null)
                    })
                })
            },
            render: function(a) {
                this.renderIframe(a, c.proto + "://www.twitvid.com/embed.php?autoplay=0&guid=" + this.data.media_id)
            }
        }), c.mediaType("GoogleVideo", {
            icon: "video",
            domain: "http://video.google.com",
            ssl: !1,
            flaggable: !0,
            matchers: {
                video: /^#{optional_protocol}video\.google\.com\/([a-zA-Z0-9_\-\?\=\&\#]+)/i
            },
            process: function(a, b) {
                this.data.width = 400, this.data.height = 326, b && b.maxwidth && b.maxwidth < this.data.width && (this.data.width = b.maxwidth, this.data.height = Math.round(b.maxwidth * 326 / 400)), this.slug.match(/#docid=(\-?\d+)/) ? (this.data.doc_id = RegExp.$1, a()) : this.slug.match(/\?docid=(\-?\d+)/) && (this.data.doc_id = RegExp.$1, a())
            },
            content: function() {
                var a = '         <embed type="application/x-shockwave-flash"                 id="VideoPlayback"                 src="http://video.google.com/googleplayer.swf?docid={{doc_id}}&hl=en&fs=true"                 style="width:{{width}}px;height:{{height}}px"                 allowFullScreen="true"                 allowScriptAccess="always"                wmode="opaque" />';
                return d.to_html(a, this.data)
            }
        }), c.mediaType("JustinTV", {
            icon: "video",
            domain: "http://justin.tv",
            ssl: !1,
            flaggable: !0,
            matchers: {
                embed: /^#{protocol_no_ssl}([a-zA-Z0-9_\-\?\=]*\.)?justin\.tv\/[a-zA-Z0-9]+(\/b\/\d+)?\/?(\?\w*?)?(#\w*)?$/i
            },
            getImageURL: function(a, b) {
                var c = this;
                this.process(function() {
                    c.data && c.data.thumbnail_url ? b(c.data.thumbnail_url) : b(null)
                })
            },
            process: function(a, b) {
                var d = this,
                    e = 400,
                    f = 300;
                c.sandboxedAjax.send({
                    url: "http://api.justin.tv/api/embed/from_url.json",
                    dataType: "jsonp",
                    jsonp: "jsonp",
                    data: {
                        url: d.url,
                        maxwidth: b && b.maxwidth || e
                    },
                    success: function(c) {
                        c.error || (d.data.embed = d.useOpaqueModeForFlash(d.resizeHtmlEmbed(c.html, b, e, f)), c.thumbnail_url && (d.data.thumbnail_url = c.thumbnail_url), a())
                    }
                })
            },
            content: function() {
                return this.data.embed
            }
        }), c.mediaType("Kickstarter", {
            icon: "generic",
            domain: "//kickstarter.com",
            ssl: !0,
            matchers: {
                project: /^#{optional_protocol}?(kickstarter\.com\/projects\/[a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-]+)/i
            },
            process: function(a) {
                this.data.height = "380px", this.data.width = "220px", a()
            },
            render: function(a) {
                var b = this.slug;
                b.slice(-1) !== "/" && (b += "/"), b += "widget/card.html", this.renderIframe(a, c.proto + "://www." + b)
            }
        }), c.mediaType("MTV", {
            icon: "video",
            domain: "http://mtv.com",
            ssl: !1,
            matchers: {
                video: /^#{optional_protocol}?mtv\.com\/videos\/([a-z0-9\-\_]+\/)+[0-9]+\/[a-z0-9\-\_]+\.jhtml(#[a-z0-9\=\&]+)?/i
            },
            process: function(a, b) {
                var d = this;
                b = b || {}, c.sandboxedAjax.send({
                    url: "http://www.mtv.com/videos/oembed",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        url: this.url,
                        maxwidth: b.maxwidth
                    },
                    success: function(b) {
                        b.error || (d.data.url = b.url, b.width > 315 ? (d.data.width = 315, d.data.height = Math.floor(b.height * 315 / b.width)) : (d.data.height = b.height, d.data.width = b.width), a())
                    }
                })
            },
            content: function() {
                var a = '<object width="{{width}}" height="{{height}}">                <param name="movie" value="{{url}}"/>                <param name="allowFullScreen" value="true"/>                <param name="allowscriptaccess" value="always"/>                <param name="wmode" value="opaque"/>                <embed src="{{url}}"                        type="application/x-shockwave-flash"                        allowscriptaccess="always"                        allowfullscreen="true"                        wmode="opaque"                        width="{{width}}"                        height="{{height}}"/>              </object>';
                return d.to_html(a, this.data)
            }
        }), c.mediaType("WashingtonPost", {
            icon: "video",
            domain: "http://washingtonpost.com",
            matchers: {
                video: /(^(?:#{protocol}?(?:[\w\-\_]+\.))?washingtonpost\.com\/wp-dyn\/content\/video\/\d{4}\/\d{2}\/\d{2}\/VI\d+\.html(#{wildcard})?)/i
            },
            ssl: !1,
            process: function(a, b) {
                var d = this,
                    e = 400,
                    f = 225;
                c.sandboxedAjax.send({
                    url: "http://specials.washingtonpost.com/tv/info.json",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        url: this.url,
                        maxwidth: b && b.maxwidth || e
                    },
                    success: function(c) {
                        c.error || (d.data.embed = d.useOpaqueModeForFlash(d.resizeHtmlEmbed(c.html, b, e, f)), d.data.width = c.width, d.data.height = c.height, a())
                    }
                })
            },
            content: function() {
                return this.data.embed
            }
        }), c.mediaType("MSNBC", {
            icon: "video",
            domain: "http://msnbc.com",
            ssl: !1,
            matchers: {
                video: /(^(?:#{protocol}?(?:[\w\-\_]+\.))?msnbc\.msn\.com\/id\/\d{1,8}\/vp\/\d{1,8}(#{wildcard})?)/i
            },
            process: function(a, b) {
                var d = this,
                    e = 420,
                    f = 245;
                c.sandboxedAjax.send({
                    url: "http://www.polls.newsvine.com/_labs/twitter/oembed",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        format: "jsonp",
                        url: this.url,
                        maxwidth: b && b.maxwidth || e
                    },
                    success: function(c) {
                        c.error || (d.data.embed = d.resizeHtmlEmbed(c.html, b, e, f), d.data.width = c.width, d.data.height = c.height, a())
                    }
                })
            },
            content: function() {
                return this.data.embed
            }
        }), c.mediaType("CNN", {
            icon: "video",
            domain: "http://cnn.com",
            title: "CNN Video",
            ssl: !1,
            deciderKey: "phoenix_cnn_details",
            matchers: {
                video: /(^(?:#{protocol}?(?:(?:www|edition|us)\.)?)?cnn\.com\/video\/[\?|#]\/#{wildcard})/i
            },
            process: function(a, b) {
                var d = this,
                    e = this.url,
                    f = 416,
                    g = 374,
                    h = e.split("?");
                h.length > 2 && (h.pop(), e = h.join("?")), c.sandboxedAjax.send({
                    url: "http://newspulse.cnn.com/widget/json/twitter-video",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        format: "jsonp",
                        maxwidth: b && b.maxwidth || f,
                        url: e
                    },
                    success: function(c) {
                        c.error || (d.data.embed = d.resizeHtmlEmbed(c.html, b, f, g), d.data.attribution_url = "http://cnn.com/video", d.data.width = c.width, d.data.height = c.height, a())
                    }
                })
            },
            content: function() {
                return this.data.embed
            }
        }), c.mediaType("Apple", {
            icon: function() {
                switch (this.label) {
                    case "song":
                        return "song";
                    case "album":
                        return "album";
                    case "music_video":
                    case "video":
                    case "movie":
                    case "tv":
                        return "video";
                    case "software":
                        return "software";
                    case "event":
                    case "preorder":
                    case "playlist":
                    case "ping_playlist":
                    case "podcast":
                    case "book":
                    default:
                        return "generic"
                }
            },
            domain: "http://itunes.apple.com",
            deciderKey: "phoenix_apple_itunes",
            matchers: {
                song: /^#{itunes_protocol}(?:\/album)\/.*\?i=/i,
                album: /^#{itunes_protocol}(?:\/album)\//i,
                event: /^#{itunes_protocol}\/event\//i,
                music_video: /^#{itunes_protocol}(?:\/music-video)\//i,
                video: /^#{itunes_protocol}(?:\/video)\//i,
                software: /^#{itunes_protocol}(?:\/app)\//i,
                playlist: /^#{itunes_protocol}(?:\/imix)\//i,
                ping_playlist: /^#{itunes_protocol}(?:\/imixes)\?/i,
                preorder: /^#{itunes_protocol}(?:\/preorder)\//i
            },
            ssl: !1,
            getImageURL: function(a, b) {
                var c = this;
                this.process(function() {
                    c.data && c.data.src ? b(c.data.src) : b(null)
                })
            },
            enableAPI: !1,
            validActions: {
                resizeFrame: !0,
                bind: !0,
                unbind: !0
            },
            process: function(a, b) {
                var d = this;
                b = b || {}, c.sandboxedAjax.send({
                    url: "http://itunes.apple.com/WebObjects/MZStore.woa/wa/remotePreview",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        url: this.url,
                        maxwidth: b.maxwidth
                    },
                    success: function(b) {
                        b.error || (d.data.src = b.src, d.data.attribution_icon = b.attribution_icon, d.data.attribution_url = b.attribution_url, d.data.attribution_title = "iTunes", b.favicon && (d.data.attribution_icon = b.favicon), b.faviconLink && (d.data.attribution_url = b.faviconLink), b.height && (d.data.height = b.height), a())
                    }
                })
            },
            render: function(a) {
                this.renderEmbeddedApplication(a, this.data.src)
            }
        });
        var f = {
            _queue: [],
            push: function(a, b) {
                b === !0 ? this._queue.unshift(a) : this._queue.push(a), this._process()
            },
            _process: function() {
                var a = this;
                if (this._isProcessing) return;
                this._isProcessing = !0, setTimeout(function() {
                    var b = a._queue.shift();
                    a._isProcessing = !1, b && (b(), a._process())
                }, 200)
            }
        };
        c.mediaType("Instagram", {
            icon: "photo",
            domain: "//instagr.am",
            title: "Instagram",
            deciderKey: "phoenix_instagram_and_friends",
            ssl: !0,
            height: 435,
            matchers: {
                video: /^#{optional_protocol_subdomain}?(?:instagr\.am|instagram\.com)\/p\/([a-zA-Z0-9_\-]+\/?)/i
            },
            getImageURL: function(a, b) {
                var c = this;
                this.process(function() {
                    if (c.data && c.data.href) {
                        var d = phx.constants.imageSizes;
                        a === d.small || a === d.medium ? b(c.data.smallSrc) : b(c.data.src)
                    } else b(null)
                }, {
                    size: a
                })
            },
            process: function(a, b) {
                this.data.href = d.to_html("{{domain}}/p/{{slug}}", {
                    domain: this.constructor.domain,
                    slug: this.slug
                }), this.data.src = phx.util.joinPath(this.data.href, "media/?size=l"), this.data.smallSrc = phx.util.joinPath(this.data.href, "media/?size=t"), this.data.name = this.constructor._name, f.push(a, b && b.size === phx.constants.imageSizes.large)
            },
            content: function() {
                var a = '        <div class="instagram">          <a class="inline-media-image" data-inline-type="{{name}}" href="{{href}}" target="_blank">            <img src="{{src}}"/>          </a>        </div>';
                return d.to_html(a, this.data)
            },
            flaggable: !0
        }), c.mediaType("Dipdive", {
            domain: "http://dipdive.com",
            ssl: !1,
            deciderKey: "phoenix_dipdive_details",
            matchers: {
                photos: /^#{optional_protocol_subdomain}?dipdive\.com\/(((?:member\/[a-zA-Z0-9\-]+\/)?pictures\/([0-9]+))|(v\/[a-zA-Z0-9]+))/i,
                videos: /^#{optional_protocol_subdomain}?dipdive\.com\/(((?:member\/[a-zA-Z0-9\-]+\/)?media\/([0-9]+))|(v\/[a-zA-Z0-9]+))/i
            },
            icon: function(a) {
                return this._icon ? this._icon : (this.url.match(/pictures/) ? this._icon = "photo" : this._icon = "video", this._icon)
            },
            process: function(a, b) {
                var d = this,
                    e = 425,
                    f = 385;
                b = b || {}, c.sandboxedAjax.send({
                    url: "http://api.dipdive.com/oembed.jsonp",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        url: this.url,
                        maxwidth: b && b.maxwidth || e
                    },
                    success: function(c) {
                        c.error || (c.type === "photo" ? (d.data.type = "photo", d.data.href = c.url, d.data.name = d.constructor._name) : (d.data.embed = d.resizeHtmlEmbed(c.html, b, e, f), d.data.width = c.width, d.data.height = c.height), a())
                    }
                })
            },
            content: function() {
                var a;
                return this.data.type === "photo" ? (a = '<div class="dipdive">               <a class="inline-media-image" data-inline-type="{{name}}" href="{{href}}" target="_blank">                 <img src="{{href}}"/>               </a>             </div>', d.to_html(a, this.data)) : this.data.embed
            },
            flaggable: !0
        }), c.mediaType("SlideShare", {
            icon: "generic",
            domain: "http://slideshare.com",
            ssl: !0,
            deciderKey: "phoenix_instagram_and_friends",
            matchers: {
                slides: /^#{optional_protocol}?slideshare\.(?:com|net)\/[a-zA-Z0-9\.]+\/[a-zA-Z0-9-]+\/?#{wildcard}?/i
            },
            process: function(a, b) {
                var d = this;
                b = b || {}, c.sandboxedAjax.send({
                    url: "https://www.slideshare.net/api/oembed/2",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        url: this.url,
                        format: "json",
                        maxwidth: b.maxwidth || 390
                    },
                    success: function(b) {
                        b.error || (d.data.embed = d.resizeHtmlEmbed(b.html), d.data.attribution_url = b.author_url, d.data.attribution_title = b.author_name, a())
                    }
                })
            },
            content: function() {
                return this.data.embed
            },
            flaggable: !0
        }), c.mediaType("BlipTV", {
            icon: "video",
            domain: "//blip.tv",
            flaggable: !0,
            title: "blip.tv",
            ssl: !1,
            deciderKey: "phoenix_instagram_and_friends",
            matchers: {
                videos: /^#{optional_protocol}?blip\.tv\/(?:(?:file\/[\w-]+)|(?:(?:[\w-]+\/)?[\w-]+-(?:\d+)))\/?/i
            },
            getImageURL: function(a, b) {
                var c = this;
                this.process(function() {
                    b(c.data.thumbnail_url)
                })
            },
            process: function(a, b) {
                var d = this;
                b = b || {}, c.sandboxedAjax.send({
                    url: "//blip.tv/oembed",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        url: this.url,
                        maxwidth: b.maxwidth
                    },
                    success: function(b) {
                        b.error || (d.data.embed = b.html, d.data.thumbnail_url = b.thumbnail_url, d.data.width = b.width, d.data.height = b.height, a())
                    }
                })
            },
            content: function() {
                return this.data.embed
            }
        }), c.mediaType("Livestream", {
            icon: "video",
            domain: "http://www.livestream.com",
            ssl: !1,
            flaggable: !0,
            matchers: {
                wwwlivestream: /^#{optional_protocol}?livestream\.com\/[\w_]+(\/#{wildcard})?/i,
                livestream: /^#{protocol}?livestre\.am\/[\w_]+(\/#{wildcard})?/i,
                twitcam: /^#{protocol}?twitcam\.(?:livestream\.)com\/[\w_]+(\/#{wildcard})?/i
            },
            process: function(a, b) {
                var d = this;
                b = b || {}, c.sandboxedAjax.send({
                    url: "http://www.livestream.com/oembed",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        url: this.url,
                        maxwidth: b.maxwidth
                    },
                    success: function(b) {
                        b.error || (d.data.embed = b.html, a())
                    }
                })
            },
            content: function() {
                return this.data.embed
            }
        }), c.mediaType("WallStreetJournal", {
            icon: "video",
            domain: "http://online.wsj.com",
            title: "The Wall Street Journal Digital Network",
            ssl: !1,
            matchers: {
                video: /^#{protocol}?online\.wsj\.com\/video\/[A-Z0-9a-z\-]+\/[A-Z0-9a-z\-]+\.html/i
            },
            process: function(a, b) {
                var d = this,
                    e = 450,
                    f = 344;
                b = b || {}, c.sandboxedAjax.send({
                    url: "http://online.wsj.com/oembed",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        url: this.url,
                        maxwidth: b && b.maxwidth || e
                    },
                    success: function(c) {
                        c.error || (d.data.embed = d.useOpaqueModeForFlash(d.resizeHtmlEmbed(c.html, b, e, f)), d.data.width = c.width, d.data.height = c.height, a())
                    }
                })
            },
            content: function() {
                return this.data.embed
            }
        }), c.mediaType("Hulu", {
            icon: "video",
            domain: "http://www.hulu.com",
            ssl: !1,
            height: 253,
            matchers: {
                video: /^#{optional_protocol}?hulu\.com\/w(atch)?\/([a-zA-Z0-9]+)/i
            },
            getImageURL: function(a, b) {
                var c = this;
                this.process(function() {
                    b(c.data.thumbnail_url)
                })
            },
            process: function(a, b) {
                var d = this;
                b = b || {}, c.sandboxedAjax.send({
                    url: "http://www.hulu.com/api/oembed",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        url: this.url,
                        maxwidth: b.maxwidth
                    },
                    success: function(b) {
                        b.error || (d.data.embed = d.useOpaqueModeForFlash(b.html), d.data.thumbnail_url = b.thumbnail_url, d.data.width = b.width, d.data.height = b.height, a())
                    }
                })
            },
            content: function() {
                return this.data.embed
            }
        }), c.mediaType("NHL", {
            icon: "video",
            domain: "http://www.nhl.com",
            ssl: !1,
            matchers: {
                video: /^#{protocol}?video\.([a-z]{4,11}\.)?nhl\.com\/videocenter\/console\?(((catid=-?\d+&)?id=\d+)|(hlg=\d{8},\d,\d{1,4}(&event=[A-Z0-9]{4,6})?)|(hlp=\d{5,10}(&event=[A-Z0-9]{4,6})?))/i
            },
            process: function(a, b) {
                var d = this;
                b = b || {}, c.sandboxedAjax.send({
                    url: "http://video.nhl.com/videocenter/oembed",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        url: this.url,
                        maxwidth: b.maxwidth
                    },
                    success: function(b) {
                        b.error || (d.data.embed = d.useOpaqueModeForFlash(b.html), d.data.width = b.width, d.data.height = b.height, a())
                    }
                })
            },
            content: function() {
                return this.data.embed
            }
        }), c.mediaType("Meetup", {
            icon: "generic",
            domain: "//www.meetup.com",
            deciderKey: "phoenix_local_meetup",
            ssl: !0,
            matchers: {
                anevent: /^#{protocol_no_ssl}?(?:(((www|dev)\.){0,2}?meetup.com)|meetu.ps)\/(?:u\/)?[\w\-]{3,}(?:[a-zA-Z0-9_#\.\-\?\&\=\/]+)/i
            },
            process: function(a, b) {
                var d = this;
                b = b || {}, c.sandboxedAjax.send({
                    url: "//api.meetup.com/oembed",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        url: this.url,
                        maxwidth: b.maxwidth
                    },
                    success: function(b) {
                        b.error || (d.data.html = b.html, a())
                    }
                })
            },
            content: function() {
                return this.data.html
            }
        }), c.mediaType("Plancast", {
            icon: "generic",
            domain: "//plancast.com",
            deciderKey: "phoenix_local_plancast",
            ssl: !0,
            matchers: {
                anevent: /^#{protocol}?(?:[a-z0-9]+\.)?plancast\.com\/p\/(?:[a-z0-9]+)\/?$/i
            },
            enableAPI: !1,
            validActions: {
                resizeFrame: !0,
                bind: !0,
                unbind: !0
            },
            process: function(a, b) {
                var d = this;
                b = b || {}, c.sandboxedAjax.send({
                    url: "//plancast.com/oembed",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        url: this.url,
                        maxwidth: b.maxwidth
                    },
                    success: function(b) {
                        b.error || (d.data.src = e(b.src), b.height && (d.data.height = b.height), a())
                    }
                })
            },
            render: function(a) {
                this.renderEmbeddedApplication(a, this.data.src)
            }
        }), c.mediaType("Gowalla", {
            icon: "generic",
            domain: "//www.gowalla.com",
            deciderKey: "phoenix_local_gowalla",
            ssl: !0,
            matchers: {
                anevent: /^#{protocol}?(((go)?wal.la)\/([chpnt])\/\w+\/?|gowalla.com\/(trips|challenges|checkins|pins)\/\d+\/?)/i
            },
            enableAPI: !1,
            validActions: {
                resizeFrame: !0,
                bind: !0,
                unbind: !0
            },
            process: function(a, b) {
                var d = this;
                b = b || {}, c.sandboxedAjax.send({
                    url: "//gowalla.com/api/twitter_oembed",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        url: this.url,
                        maxwidth: b.maxwidth
                    },
                    success: function(b) {
                        b.error || (d.data.src = b.src, b.height && (d.data.height = b.height), a())
                    }
                })
            },
            render: function(a) {
                this.renderEmbeddedApplication(a, this.data.src)
            }
        }), c.mediaType("Foursquare", {
            icon: "generic",
            domain: "//www.foursquare.com",
            deciderKey: "phoenix_local_foursquare",
            ssl: !0,
            matchers: {
                anevent: /^#{optional_protocol}?foursquare\.com\/([a-zA-Z0-9\-]+)\/checkin\/(#{wildcard})/i
            },
            enableAPI: !1,
            validActions: {
                resizeFrame: !0,
                bind: !0,
                unbind: !0
            },
            process: function(a, b) {
                var d = this;
                b = b || {}, c.sandboxedAjax.send({
                    url: "https://api.foursquare.com/services/oembed",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        url: this.url,
                        maxwidth: b.maxwidth
                    },
                    success: function(b) {
                        b.error || (d.data.src = b.src, b.height && (d.data.height = b.height), a())
                    }
                })
            },
            render: function(a) {
                this.renderEmbeddedApplication(a, this.data.src)
            }
        }), c.mediaType("Amazon", {
            icon: "generic",
            domain: "//www.amazon.com",
            deciderKey: "phoenix_amazon_details",
            ssl: !0,
            matchers: {
                review: /^#{protocol}?www\.amazon\.(com|de|fr|ca|it|(?:co\.(?:jp|uk)))(?:(?!(\/[^\/]*)?\/[bs][\/\?]|\/gp\/browse\.html|\/aw\/ri\/|\/gp\/search|\/search|\/gp\/feature|\/gp\/goldbox|\/gp\/registry))(?:#{wildcard}?)/i
            },
            enableAPI: !1,
            validActions: {
                resizeFrame: !0,
                bind: !0,
                unbind: !0
            },
            process: function(a, b) {
                var d = c.media.types.Amazon.matchers,
                    e = this,
                    f = this.url;
                b = b || {}, matches = f.match(d.review), matches[1] && c.sandboxedAjax.send({
                    url: "//www.amazon." + matches[1] + "/gp/twitter/oembed",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        url: this.url,
                        maxwidth: b.maxwidth
                    },
                    success: function(b) {
                        b.error || (e.data.src = b.src, b.height && (e.data.height = b.height), a())
                    }
                })
            },
            render: function(a) {
                this.renderEmbeddedApplication(a, this.data.src)
            }
        }), c.mediaType("AolVideo", {
            icon: "video",
            domain: "http://www.aol.com",
            title: "Aol",
            deciderKey: "phoenix_aol_video",
            matchers: {
                video: /^#{protocol_no_ssl}?share\.aolvideo\.com\/twitter\.php\?video\=(#{wildcard})/i
            },
            process: function(a, b) {
                var d = this;
                b = b || {}, c.sandboxedAjax.send({
                    url: "http://share.aolvideo.com/oembed",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        url: this.url,
                        maxwidth: b.maxwidth
                    },
                    success: function(b) {
                        b.error || (d.data.embed = b.html, d.data.width = b.width, d.data.height = b.height, a())
                    }
                })
            },
            content: function() {
                return this.data.embed
            }
        }), c.mediaType("Photobucket", {
            icon: "photo",
            domain: "http://photobucket.com",
            flaggable: !0,
            matchers: {
                user_groups: /^#{protocol}?(?:g?(?:i|s)(?:\d+|mg))\.photobucket\.com\/(?:albums|groups)\/(?:#{wildcard})/i
            },
            process: function(a, b) {
                var d = this;
                b = b || {}, c.sandboxedAjax.send({
                    url: "http://photobucket.com/oembed",
                    type: "GET",
                    dataType: "jsonp",
                    data: {
                        url: this.url.replace(/^([^?]*[^/])(?=\?)/, "$1/"),
                        maxwidth: b.maxwidth
                    },
                    success: function(b) {
                        b.error || (d.data.href = b.url, d.data.name = d.constructor._name, a())
                    }
                })
            },
            getImageURL: function(a, b) {
                var c = this;
                this.process(function() {
                    b(c.data.href)
                })
            },
            render: function(a) {
                var b = '        <div class="photobucket">          <a class="inline-media-image" data-inline-type="{{name}}" href="{{href}}" target="_blank">            <img src="{{href}}"/>          </a>        </div>';
                $(a).append(d.to_html(b, this.data))
            }
        }), c.mediaType("With", {
            icon: "photo",
            domain: c.isSSL() ? "https://with.me" : "http://with.me",
            ssl: !0,
            deciderKey: "phoenix_withme_details",
            matchers: {
                project: /^#{optional_protocol}?with\.me[\/\?]\??[a-zA-Z0-9]+$/i
            },
            process: function(a, b) {
                var d = this;
                b = b || {}, c.sandboxedAjax.send({
                    url: "//with.me/services/oembed",
                    dataType: "jsonp",
                    type: "GET",
                    data: {
                        url: this.url,
                        maxwidth: b.maxwidth
                    },
                    success: function(b) {
                        !b.error && b.hasOwnProperty("url") && (d.data.href = d.url, d.data.src = b.url, d.data.title = b.title, a())
                    }
                })
            },
            content: function() {
                var a = '           <div class="with-me">             <a class="inline-media-image" href="{{href}}" target="_blank">               <img src="{{src}}"/>             </a>           </div>';
                return d.to_html(a, this.data)
            },
            flaggable: !0
        }), c.mediaType("WordPress", {
            icon: "generic",
            domain: "//wordpress.com",
            ssl: !0,
            deciderKey: "phoenix_wordpress_details",
            matchers: {
                tinyUrl: /^#{optional_protocol}?(?:[a-z0-9]+\.)?wp\.me[\/\?][a-zA-Z0-9_#\.\-\?\&\=\/]+$/i,
                standardUrl: /^#{optional_protocol}?(?:[a-z0-9]+\.)?wordpress\.com[\/\?][a-zA-Z0-9_#\.\-\?\&\=\/]+$/i
            },
            process: function(a, b) {
                var d = this;
                b = b || {};
                var e = "//public-api.wordpress.com/oembed/1.0/?for=twitter.com&as_article=true",
                    f = {
                        url: this.url
                    };
                window.location.href.indexOf("/status/") > 0 && (f.maxwidth = 433), c.sandboxedAjax.send({
                    url: e,
                    dataType: "jsonp",
                    type: "GET",
                    data: f,
                    success: function(b) {
                        !b.error && b.title && (d.data.href = d.url, b.thumbnail_url && b.thumbnail_url.indexOf("http:") >= 0 && (b.thumbnail_url = b.thumbnail_url.replace("http", "https")), d.data = c.merge(d.data, b), a())
                    }
                })
            },
            content: function() {
                var a = '                <div id="wp-details" class="component"><div class="wp-inset">                <a href="{{href}}" class="wp-link" target="_blank">                <h1 class="wp-news-headline">{{title}}</h1></a>                <p class="wp-news-description">{{body}}</p>                {{#thumbnail_url}}                <div><a class="inline-media-image" href="{{href}}" target="_blank">                <img class="wp-img" src="{{thumbnail_url}}"/>                </a></div>                {{/thumbnail_url}}                </div></div>';
                return d.to_html(a, this.data)
            },
            flaggable: !0
        }), c.mediaType("WhoSay", {
            domain: "//www.whosay.com",
            ssl: !0,
            flaggable: !0,
            deciderKey: "phoenix_whosay_details",
            icon: "photo",
            matchers: {
                media: /^#{optional_protocol}?whosay\.com\/[^\/\s]+\/photos\/(\d+)/i
            },
            getImageURL: function(a, b) {
                if (this.slug) {
                    if (a === phx.constants.imageSizes.medium) return b(phx.util.supplant("//d1au12fyca1yp1.cloudfront.net/{id}/{id}_melt.jpg", {
                        id: this.slug
                    }));
                    if (a === phx.constants.imageSizes.large) return b(phx.util.supplant("//d1au12fyca1yp1.cloudfront.net/{id}/{id}_lalt.jpg", {
                        id: this.slug
                    }))
                }
                b(null)
            },
            process: function(a) {
                this.data.href = this.url, this.data.name = this.constructor._name, this.data.src = phx.util.supplant("//d1au12fyca1yp1.cloudfront.net/{id}/{id}_melt.jpg", {
                    id: this.slug
                }), a()
            },
            content: function() {
                var a = '<div class="whosay">                  <a class="inline-media-image" data-inline-type="{{name}}" href="{{href}}" target="_blank">                    <img alt="" src="{{src}}">                  </a>                </div>';
                return d.to_html(a, this.data)
            }
        }), c.mediaType("Pepsi", {
            domain: "//www.pepsi.com",
            ssl: !0,
            deciderKey: "phoenix_pepsi_details",
            icon: "video",
            matchers: {
                media: /^#{optional_protocol}?pepsi\.com\/(CelebrateBad25)/i
            },
            process: function(a) {
                this.data.width = 432, this.data.height = 243, a()
            },
            render: function(a) {
                var b = "https://tremolossl-a.akamaihd.net/clients/twitter/20120829_mj/twitter/index.html";
                this.renderIframe(a, b)
            }
        }), a(b)
    })
})
deferred('$lib/easyXDM.js', function() {
    /*! easyxdm.net (c) 2009-2011, Ã˜yvind Sean Kinsey oyvind@kinsey.no https://raw.github.com/oyvindkinsey/easyXDM/master/MIT-license.txt */
    (function(a, b, c, d, e, f) {
        function s(a, b) {
            var c = typeof a[b];
            return c == "function" || c == "object" && !! a[b] || c == "unknown"
        }
        function t(a, b) {
            return typeof a[b] == "object" && !! a[b]
        }
        function u(a) {
            return Object.prototype.toString.call(a) === "[object Array]"
        }
        function v(a) {
            try {
                var b = new ActiveXObject(a);
                return b = null, !0
            } catch (c) {
                return !1
            }
        }
        function B() {
            B = i, y = !0;
            for (var a = 0; a < z.length; a++) z[a]();
            z.length = 0
        }
        function D(a, b) {
            if (y) {
                a.call(b);
                return
            }
            z.push(function() {
                a.call(b)
            })
        }
        function E() {
            var a = parent;
            if (m !== "") for (var b = 0, c = m.split("."); b < c.length; b++) a = a[c[b]];
            return a.easyXDM
        }
        function F(b) {
            return a.easyXDM = o, m = b, m && (p = "easyXDM_" + m.replace(".", "_") + "_"), n
        }
        function G(a) {
            return a.match(j)[3]
        }
        function H(a) {
            var b = a.match(j),
                c = b[2],
                d = b[3],
                e = b[4] || "";
            if (c == "http:" && e == ":80" || c == "https:" && e == ":443") e = "";
            return c + "//" + d + e
        }
        function I(a) {
            a = a.replace(l, "$1/");
            if (!a.match(/^(http||https):\/\//)) {
                var b = a.substring(0, 1) === "/" ? "" : c.pathname;
                b.substring(b.length - 1) !== "/" && (b = b.substring(0, b.lastIndexOf("/") + 1)), a = c.protocol + "//" + c.host + b + a
            }
            while (k.test(a)) a = a.replace(k, "");
            return a
        }
        function J(a, b) {
            var c = "",
                d = a.indexOf("#");
            d !== -1 && (c = a.substring(d), a = a.substring(0, d));
            var e = [];
            for (var g in b) b.hasOwnProperty(g) && e.push(g + "=" + f(b[g]));
            return a + (r ? "#" : a.indexOf("?") == -1 ? "?" : "&") + e.join("&") + c
        }
        function L(a) {
            return typeof a == "undefined"
        }
        function M() {
            var a = {}, b = {
                a: [1, 2, 3]
            }, c = '{"a":[1,2,3]}';
            return typeof JSON != "undefined" && typeof JSON.stringify == "function" && JSON.stringify(b).replace(/\s/g, "") === c ? JSON : (Object.toJSON && Object.toJSON(b).replace(/\s/g, "") === c && (a.stringify = Object.toJSON), typeof String.prototype.evalJSON == "function" && (b = c.evalJSON(), b.a && b.a.length === 3 && b.a[2] === 3 && (a.parse = function(a) {
                return a.evalJSON()
            })), a.stringify && a.parse ? (M = function() {
                return a
            }, a) : null)
        }
        function N(a, b, c) {
            var d;
            for (var e in b) b.hasOwnProperty(e) && (e in a ? (d = b[e], typeof d == "object" ? N(a[e], d, c) : c || (a[e] = b[e])) : a[e] = b[e]);
            return a
        }
        function O() {
            var c = b.createElement("iframe");
            c.name = p + "TEST", N(c.style, {
                position: "absolute",
                left: "-2000px",
                top: "0px"
            }), b.body.appendChild(c), q = c.contentWindow !== a.frames[c.name], b.body.removeChild(c)
        }
        function P(a) {
            L(q) && O();
            var c;
            q ? c = b.createElement("<iframe name='" + a.props.name + "' frameborder='0' allowtransparency='false' tabindex='-1', role='presentation' scrolling='no' />") : (c = b.createElement("IFRAME"), c.name = a.props.name, c.setAttribute("frameborder", "0"), c.setAttribute("allowtransparency", "false"), c.setAttribute("tabindex", "-1"), c.setAttribute("role", "presentation"), c.setAttribute("scrolling", "no")), c.id = c.name = a.props.name, delete a.props.name, a.onLoad && w(c, "load", a.onLoad), typeof a.container == "string" && (a.container = b.getElementById(a.container)), a.container || (c.style.position = "absolute", c.style.top = "-2000px", a.container = b.body);
            var d = a.props.src;
            return delete a.props.src, N(c, a.props), c.border = c.frameBorder = 0, a.container.appendChild(c), c.src = d, a.props.src = d, c
        }
        function Q(a, b) {
            typeof a == "string" && (a = [a]);
            var c, d = a.length;
            while (d--) {
                c = a[d], c = new RegExp(c.substr(0, 1) == "^" ? c : "^" + c.replace(/(\*)/g, ".$1").replace(/\?/g, ".") + "$");
                if (c.test(b)) return !0
            }
            return !1
        }
        function R(d) {
            var e = d.protocol,
                f;
            d.isHost = d.isHost || L(K.xdm_p), r = d.hash || !1, d.props || (d.props = {});
            if (!d.isHost) {
                d.channel = K.xdm_c, d.secret = K.xdm_s, d.remote = K.xdm_e, e = K.xdm_p;
                if (d.acl && !Q(d.acl, d.remote)) throw new Error("Access denied for " + d.remote)
            } else d.remote = I(d.remote), d.channel = d.channel || "default" + h++, d.secret = Math.random().toString(16).substring(2), L(e) && (H(c.href) == H(d.remote) ? e = "4" : s(a, "postMessage") || s(b, "postMessage") ? e = "1" : s(a, "ActiveXObject") && v("ShockwaveFlash.ShockwaveFlash") ? e = "6" : navigator.product === "Gecko" && "frameElement" in a && navigator.userAgent.indexOf("WebKit") == -1 ? e = "5" : d.remoteHelper ? (d.remoteHelper = I(d.remoteHelper), e = "2") : e = "0");
            switch (e) {
                case "0":
                    N(d, {
                        interval: 100,
                        delay: 2e3,
                        useResize: !0,
                        useParent: !1,
                        usePolling: !1
                    }, !0);
                    if (d.isHost) {
                        if (!d.local) {
                            var g = c.protocol + "//" + c.host,
                                i = b.body.getElementsByTagName("img"),
                                j, k = i.length;
                            while (k--) {
                                j = i[k];
                                if (j.src.substring(0, g.length) === g) {
                                    d.local = j.src;
                                    break
                                }
                            }
                            d.local || (d.local = a)
                        }
                        var l = {
                            xdm_c: d.channel,
                            xdm_p: 0
                        };
                        d.local === a ? (d.usePolling = !0, d.useParent = !0, d.local = c.protocol + "//" + c.host + c.pathname + c.search, l.xdm_e = d.local, l.xdm_pa = 1) : l.xdm_e = I(d.local), d.container && (d.useResize = !1, l.xdm_po = 1), d.remote = J(d.remote, l)
                    } else N(d, {
                        channel: K.xdm_c,
                        remote: K.xdm_e,
                        useParent: !L(K.xdm_pa),
                        usePolling: !L(K.xdm_po),
                        useResize: d.useParent ? !1 : d.useResize
                    });
                    f = [new n.stack.HashTransport(d), new n.stack.ReliableBehavior({}), new n.stack.QueueBehavior({
                        encode: !0,
                        maxLength: 4e3 - d.remote.length
                    }), new n.stack.VerifyBehavior({
                        initiate: d.isHost
                    })];
                    break;
                case "1":
                    f = [new n.stack.PostMessageTransport(d)];
                    break;
                case "2":
                    f = [new n.stack.NameTransport(d), new n.stack.QueueBehavior, new n.stack.VerifyBehavior({
                        initiate: d.isHost
                    })];
                    break;
                case "3":
                    f = [new n.stack.NixTransport(d)];
                    break;
                case "4":
                    f = [new n.stack.SameOriginTransport(d)];
                    break;
                case "5":
                    f = [new n.stack.FrameElementTransport(d)];
                    break;
                case "6":
                    d.swf || (d.swf = "../../tools/easyxdm.swf"), f = [new n.stack.FlashTransport(d)]
            }
            return f.push(new n.stack.QueueBehavior({
                lazy: d.lazy,
                remove: !0
            })), f
        }
        function S(a) {
            var b, c = {
                incoming: function(a, b) {
                    this.up.incoming(a, b)
                },
                outgoing: function(a, b) {
                    this.down.outgoing(a, b)
                },
                callback: function(a) {
                    this.up.callback(a)
                },
                init: function() {
                    this.down.init()
                },
                destroy: function() {
                    this.down.destroy()
                }
            };
            for (var d = 0, e = a.length; d < e; d++) b = a[d], N(b, c, !0), d !== 0 && (b.down = a[d - 1]), d !== e - 1 && (b.up = a[d + 1]);
            return b
        }
        function T(a) {
            a.up.down = a.down, a.down.up = a.up, a.up = a.down = null
        }
        var g = this,
            h = Math.floor(Math.random() * 1e4),
            i = Function.prototype,
            j = /^((http.?:)\/\/([^:\/\s]+)(:\d+)*)/,
            k = /[\-\w]+\/\.\.\//,
            l = /([^:])\/\//g,
            m = "",
            n = {}, o = a.easyXDM,
            p = "easyXDM_",
            q, r = !1,
            w, x;
        if (s(a, "addEventListener")) w = function(a, b, c) {
            a.addEventListener(b, c, !1)
        }, x = function(a, b, c) {
            a.removeEventListener(b, c, !1)
        };
        else {
            if (!s(a, "attachEvent")) throw new Error("Browser not supported");
            w = function(a, b, c) {
                a.attachEvent("on" + b, c)
            }, x = function(a, b, c) {
                a.detachEvent("on" + b, c)
            }
        }
        var y = !1,
            z = [],
            A;
        "readyState" in b ? (A = b.readyState, y = A == "complete" || ~navigator.userAgent.indexOf("AppleWebKit/") && (A == "loaded" || A == "interactive")) : y = !! b.body;
        if (!y) {
            if (s(a, "addEventListener")) w(b, "DOMContentLoaded", B);
            else {
                w(b, "readystatechange", function() {
                    b.readyState == "complete" && B()
                });
                if (b.documentElement.doScroll && a === top) {
                    var C = function() {
                        if (y) return;
                        try {
                            b.documentElement.doScroll("left")
                        } catch (a) {
                            d(C, 1);
                            return
                        }
                        B()
                    };
                    C()
                }
            }
            w(a, "load", B)
        }
        var K = function(a) {
            a = a.substring(1).split("&");
            var b = {}, c, d = a.length;
            while (d--) c = a[d].split("="), b[c[0]] = e(c[1]);
            return b
        }(/xdm_e=/.test(c.search) ? c.search : c.hash);
        N(n, {
            version: "2.4.12.108",
            query: K,
            stack: {},
            apply: N,
            getJSONObject: M,
            whenReady: D,
            noConflict: F
        }), n.DomHelper = {
            on: w,
            un: x,
            requiresJSON: function(c) {
                t(a, "JSON") || b.write('<script type="text/javascript" src="' + c + '"><' + "/script>")
            }
        },
        function() {
            var a = {};
            n.Fn = {
                set: function(b, c) {
                    a[b] = c
                },
                get: function(b, c) {
                    var d = a[b];
                    return c && delete a[b], d
                }
            }
        }(), n.Socket = function(a) {
            var b = S(R(a).concat([{
                incoming: function(b, c) {
                    a.onMessage(b, c)
                },
                callback: function(b) {
                    a.onReady && a.onReady(b)
                }
            }])),
                c = H(a.remote);
            this.origin = H(a.remote), this.destroy = function() {
                b.destroy()
            }, this.postMessage = function(a) {
                b.outgoing(a, c)
            }, b.init()
        }, n.Rpc = function(a, b) {
            if (b.local) for (var c in b.local) if (b.local.hasOwnProperty(c)) {
                var d = b.local[c];
                typeof d == "function" && (b.local[c] = {
                    method: d
                })
            }
            var e = S(R(a).concat([new n.stack.RpcBehavior(this, b), {
                callback: function(b) {
                    a.onReady && a.onReady(b)
                }
            }]));
            this.origin = H(a.remote), this.destroy = function() {
                e.destroy()
            }, e.init()
        }, n.stack.SameOriginTransport = function(a) {
            var b, e, f, g;
            return b = {
                outgoing: function(a, b, c) {
                    f(a), c && c()
                },
                destroy: function() {
                    e && (e.parentNode.removeChild(e), e = null)
                },
                onDOMReady: function() {
                    g = H(a.remote), a.isHost ? (N(a.props, {
                        src: J(a.remote, {
                            xdm_e: c.protocol + "//" + c.host + c.pathname,
                            xdm_c: a.channel,
                            xdm_p: 4
                        }),
                        name: p + a.channel + "_provider"
                    }), e = P(a), n.Fn.set(a.channel, function(a) {
                        return f = a, d(function() {
                            b.up.callback(!0)
                        }, 0),
                        function(a) {
                            b.up.incoming(a, g)
                        }
                    })) : (f = E().Fn.get(a.channel, !0)(function(a) {
                        b.up.incoming(a, g)
                    }), d(function() {
                        b.up.callback(!0)
                    }, 0))
                },
                init: function() {
                    D(b.onDOMReady, b)
                }
            }
        }, n.stack.FlashTransport = function(a) {
            function l(a) {
                d(function() {
                    e.up.incoming(a, h)
                }, 0)
            }
            function o(d) {
                var e = a.swf,
                    f = "easyXDM_swf_" + Math.floor(Math.random() * 1e4),
                    g = k + 'easyXDM.Fn.get("flash_' + f + '_init")';
                n.Fn.set("flash_" + f + "_init", function() {
                    n.stack.FlashTransport.__swf = i = j.firstChild, d()
                }), j = b.createElement("div"), N(j.style, {
                    height: "1px",
                    width: "1px",
                    postition: "abosolute",
                    left: 0,
                    top: 0
                }), b.body.appendChild(j);
                var h = "proto=" + c.protocol + "&domain=" + G(c.href) + "&init=" + g;
                j.innerHTML = "<object height='1' width='1' type='application/x-shockwave-flash' id='" + f + "' data='" + e + "'>" + "<param name='allowScriptAccess' value='always'></param>" + "<param name='wmode' value='transparent'>" + "<param name='movie' value='" + e + "'></param>" + "<param name='flashvars' value='" + h + "'></param>" + "<embed type='application/x-shockwave-flash' FlashVars='" + h + "' allowScriptAccess='always' wmode='transparent' src='" + e + "' height='1' width='1'></embed>" + "</object>"
            }
            var e, f, g, h, i, j, k = m ? m + "." : "";
            return e = {
                outgoing: function(b, c, d) {
                    i.postMessage(a.channel, b), d && d()
                },
                destroy: function() {
                    try {
                        i.destroyChannel(a.channel)
                    } catch (b) {}
                    i = null, f && (f.parentNode.removeChild(f), f = null)
                },
                onDOMReady: function() {
                    h = H(a.remote), i = n.stack.FlashTransport.__swf;
                    var b = function() {
                        a.isHost ? n.Fn.set("flash_" + a.channel + "_onMessage", function(b) {
                            b == a.channel + "-ready" && (n.Fn.set("flash_" + a.channel + "_onMessage", l), d(function() {
                                e.up.callback(!0)
                            }, 0))
                        }) : n.Fn.set("flash_" + a.channel + "_onMessage", l), i.createChannel(a.channel, a.remote, a.isHost, k + 'easyXDM.Fn.get("flash_' + a.channel + '_onMessage")', a.secret), a.isHost ? (N(a.props, {
                            src: J(a.remote, {
                                xdm_e: H(c.href),
                                xdm_c: a.channel,
                                xdm_s: a.secret,
                                xdm_p: 6
                            }),
                            name: p + a.channel + "_provider"
                        }), f = P(a)) : (i.postMessage(a.channel, a.channel + "-ready"), d(function() {
                            e.up.callback(!0)
                        }, 0))
                    };
                    i ? b() : o(b)
                },
                init: function() {
                    D(e.onDOMReady, e)
                }
            }
        }, n.stack.PostMessageTransport = function(b) {
            function i(a) {
                if (a.origin) return H(a.origin);
                if (a.uri) return H(a.uri);
                if (a.domain) return c.protocol + "//" + a.domain;
                throw "Unable to retrieve the origin of the event"
            }
            function j(a) {
                var c = i(a);
                c == h && a.data.substring(0, b.channel.length + 1) == b.channel + " " && e.up.incoming(a.data.substring(b.channel.length + 1), c)
            }
            var e, f, g, h;
            return e = {
                outgoing: function(a, c, d) {
                    g.postMessage(b.channel + " " + a, c || h), d && d()
                },
                destroy: function() {
                    x(a, "message", j), f && (g = null, f.parentNode.removeChild(f), f = null)
                },
                onDOMReady: function() {
                    h = H(b.remote), b.isHost ? (w(a, "message", function i(c) {
                        c.data == b.channel + "-ready" && (g = "postMessage" in f.contentWindow ? f.contentWindow : f.contentWindow.document, x(a, "message", i), w(a, "message", j), d(function() {
                            e.up.callback(!0)
                        }, 0))
                    }), N(b.props, {
                        src: J(b.remote, {
                            xdm_e: H(c.href),
                            xdm_c: b.channel,
                            xdm_p: 1
                        }),
                        name: p + b.channel + "_provider"
                    }), f = P(b)) : (w(a, "message", j), g = "postMessage" in a.parent ? a.parent : a.parent.document, g.postMessage(b.channel + "-ready", h), d(function() {
                        e.up.callback(!0)
                    }, 0))
                },
                init: function() {
                    D(e.onDOMReady, e)
                }
            }
        }, n.stack.FrameElementTransport = function(e) {
            var f, g, h, i;
            return f = {
                outgoing: function(a, b, c) {
                    h.call(this, a), c && c()
                },
                destroy: function() {
                    g && (g.parentNode.removeChild(g), g = null)
                },
                onDOMReady: function() {
                    i = H(e.remote), e.isHost ? (N(e.props, {
                        src: J(e.remote, {
                            xdm_e: H(c.href),
                            xdm_c: e.channel,
                            xdm_p: 5
                        }),
                        name: p + e.channel + "_provider"
                    }), g = P(e), g.fn = function(a) {
                        return delete g.fn, h = a, d(function() {
                            f.up.callback(!0)
                        }, 0),
                        function(a) {
                            f.up.incoming(a, i)
                        }
                    }) : (b.referrer && H(b.referrer) != K.xdm_e && (a.top.location = K.xdm_e), h = a.frameElement.fn(function(a) {
                        f.up.incoming(a, i)
                    }), f.up.callback(!0))
                },
                init: function() {
                    D(f.onDOMReady, f)
                }
            }
        }, n.stack.NixTransport = function(e) {
            var f, h, i, j, k;
            return f = {
                outgoing: function(a, b, c) {
                    i(a), c && c()
                },
                destroy: function() {
                    k = null, h && (h.parentNode.removeChild(h), h = null)
                },
                onDOMReady: function() {
                    j = H(e.remote);
                    if (e.isHost) {
                        try {
                            s(a, "getNixProxy") || a.execScript("Class NixProxy\n    Private m_parent, m_child, m_Auth\n\n    Public Sub SetParent(obj, auth)\n        If isEmpty(m_Auth) Then m_Auth = auth\n        SET m_parent = obj\n    End Sub\n    Public Sub SetChild(obj)\n        SET m_child = obj\n        m_parent.ready()\n    End Sub\n\n    Public Sub SendToParent(data, auth)\n        If m_Auth = auth Then m_parent.send(CStr(data))\n    End Sub\n    Public Sub SendToChild(data, auth)\n        If m_Auth = auth Then m_child.send(CStr(data))\n    End Sub\nEnd Class\nFunction getNixProxy()\n    Set GetNixProxy = New NixProxy\nEnd Function\n", "vbscript"), k = getNixProxy(), k.SetParent({
                                send: function(a) {
                                    f.up.incoming(a, j)
                                },
                                ready: function() {
                                    d(function() {
                                        f.up.callback(!0)
                                    }, 0)
                                }
                            }, e.secret), i = function(a) {
                                k.SendToChild(a, e.secret)
                            }
                        } catch (l) {
                            throw new Error("Could not set up VBScript NixProxy:" + l.message)
                        }
                        N(e.props, {
                            src: J(e.remote, {
                                xdm_e: H(c.href),
                                xdm_c: e.channel,
                                xdm_s: e.secret,
                                xdm_p: 3
                            }),
                            name: p + e.channel + "_provider"
                        }), h = P(e), h.contentWindow.opener = k
                    } else {
                        b.referrer && H(b.referrer) != K.xdm_e && (a.top.location = K.xdm_e);
                        try {
                            k = a.opener
                        } catch (m) {
                            throw new Error("Cannot access window.opener")
                        }
                        k.SetChild({
                            send: function(a) {
                                g.setTimeout(function() {
                                    f.up.incoming(a, j)
                                }, 0)
                            }
                        }), i = function(a) {
                            k.SendToParent(a, e.secret)
                        }, d(function() {
                            f.up.callback(!0)
                        }, 0)
                    }
                },
                init: function() {
                    D(f.onDOMReady, f)
                }
            }
        }, n.stack.NameTransport = function(a) {
            function k(b) {
                var d = a.remoteHelper + (c ? "#_3" : "#_2") + a.channel;
                e.contentWindow.sendMessage(b, d)
            }
            function l() {
                c ? (++g === 2 || !c) && b.up.callback(!0) : (k("ready"), b.up.callback(!0))
            }
            function m(a) {
                b.up.incoming(a, i)
            }
            function o() {
                h && d(function() {
                    h(!0)
                }, 0)
            }
            var b, c, e, f, g, h, i, j;
            return b = {
                outgoing: function(a, b, c) {
                    h = c, k(a)
                },
                destroy: function() {
                    e.parentNode.removeChild(e), e = null, c && (f.parentNode.removeChild(f), f = null)
                },
                onDOMReady: function() {
                    c = a.isHost, g = 0, i = H(a.remote), a.local = I(a.local), c ? (n.Fn.set(a.channel, function(b) {
                        c && b === "ready" && (n.Fn.set(a.channel, m), l())
                    }), j = J(a.remote, {
                        xdm_e: a.local,
                        xdm_c: a.channel,
                        xdm_p: 2
                    }), N(a.props, {
                        src: j + "#" + a.channel,
                        name: p + a.channel + "_provider"
                    }), f = P(a)) : (a.remoteHelper = a.remote, n.Fn.set(a.channel, m)), e = P({
                        props: {
                            src: a.local + "#_4" + a.channel
                        },
                        onLoad: function b() {
                            var c = e || this;
                            x(c, "load", b), n.Fn.set(a.channel + "_load", o),
                            function f() {
                                typeof c.contentWindow.sendMessage == "function" ? l() : d(f, 50)
                            }()
                        }
                    })
                },
                init: function() {
                    D(b.onDOMReady, b)
                }
            }
        }, n.stack.HashTransport = function(b) {
            function o(a) {
                if (!l) return;
                var c = b.remote + "#" + j+++"_" + a;
                (f || !m ? l.contentWindow : l).location = c
            }
            function q(a) {
                i = a, c.up.incoming(i.substring(i.indexOf("_") + 1), n)
            }
            function r() {
                if (!k) return;
                var a = k.location.href,
                    b = "",
                    c = a.indexOf("#");
                c != -1 && (b = a.substring(c)), b && b != i && q(b)
            }
            function s() {
                g = setInterval(r, h)
            }
            var c, e = this,
                f, g, h, i, j, k, l, m, n;
            return c = {
                outgoing: function(a, b) {
                    o(a)
                },
                destroy: function() {
                    a.clearInterval(g), (f || !m) && l.parentNode.removeChild(l), l = null
                },
                onDOMReady: function() {
                    f = b.isHost, h = b.interval, i = "#" + b.channel, j = 0, m = b.useParent, n = H(b.remote);
                    if (f) {
                        b.props = {
                            src: b.remote,
                            name: p + b.channel + "_provider"
                        };
                        if (m) b.onLoad = function() {
                            k = a, s(), c.up.callback(!0)
                        };
                        else {
                            var e = 0,
                                g = b.delay / 50;
                            (function o() {
                                if (++e > g) throw new Error("Unable to reference listenerwindow");
                                try {
                                    k = l.contentWindow.frames[p + b.channel + "_consumer"]
                                } catch (a) {}
                                k ? (s(), c.up.callback(!0)) : d(o, 50)
                            })()
                        }
                        l = P(b)
                    } else k = a, s(), m ? (l = parent, c.up.callback(!0)) : (N(b, {
                        props: {
                            src: b.remote + "#" + b.channel + new Date,
                            name: p + b.channel + "_consumer"
                        },
                        onLoad: function() {
                            c.up.callback(!0)
                        }
                    }), l = P(b))
                },
                init: function() {
                    D(c.onDOMReady, c)
                }
            }
        }, n.stack.ReliableBehavior = function(a) {
            var b, c, d = 0,
                e = 0,
                f = "";
            return b = {
                incoming: function(a, g) {
                    var h = a.indexOf("_"),
                        i = a.substring(0, h).split(",");
                    a = a.substring(h + 1), i[0] == d && (f = "", c && c(!0)), a.length > 0 && (b.down.outgoing(i[1] + "," + d + "_" + f, g), e != i[1] && (e = i[1], b.up.incoming(a, g)))
                },
                outgoing: function(a, g, h) {
                    f = a, c = h, b.down.outgoing(e + "," + ++d + "_" + a, g)
                }
            }
        }, n.stack.QueueBehavior = function(a) {
            function m() {
                if (a.remove && c.length === 0) {
                    T(b);
                    return
                }
                if (g || c.length === 0 || i) return;
                g = !0;
                var e = c.shift();
                b.down.outgoing(e.data, e.origin, function(a) {
                    g = !1, e.callback && d(function() {
                        e.callback(a)
                    }, 0), m()
                })
            }
            var b, c = [],
                g = !0,
                h = "",
                i, j = 0,
                k = !1,
                l = !1;
            return b = {
                init: function() {
                    L(a) && (a = {}), a.maxLength && (j = a.maxLength, l = !0), a.lazy ? k = !0 : b.down.init()
                },
                callback: function(a) {
                    g = !1;
                    var c = b.up;
                    m(), c.callback(a)
                },
                incoming: function(c, d) {
                    if (l) {
                        var f = c.indexOf("_"),
                            g = parseInt(c.substring(0, f), 10);
                        h += c.substring(f + 1), g === 0 && (a.encode && (h = e(h)), b.up.incoming(h, d), h = "")
                    } else b.up.incoming(c, d)
                },
                outgoing: function(d, e, g) {
                    a.encode && (d = f(d));
                    var h = [],
                        i;
                    if (l) {
                        while (d.length !== 0) i = d.substring(0, j), d = d.substring(i.length), h.push(i);
                        while (i = h.shift()) c.push({
                            data: h.length + "_" + i,
                            origin: e,
                            callback: h.length === 0 ? g : null
                        })
                    } else c.push({
                        data: d,
                        origin: e,
                        callback: g
                    });
                    k ? b.down.init() : m()
                },
                destroy: function() {
                    i = !0, b.down.destroy()
                }
            }
        }, n.stack.VerifyBehavior = function(a) {
            function f() {
                c = Math.random().toString(16).substring(2), b.down.outgoing(c)
            }
            var b, c, d, e = !1;
            return b = {
                incoming: function(e, g) {
                    var h = e.indexOf("_");
                    h === -1 ? e === c ? b.up.callback(!0) : d || (d = e, a.initiate || f(), b.down.outgoing(e)) : e.substring(0, h) === d && b.up.incoming(e.substring(h + 1), g)
                },
                outgoing: function(a, d, e) {
                    b.down.outgoing(c + "_" + a, d, e)
                },
                callback: function(b) {
                    a.initiate && f()
                }
            }
        }, n.stack.RpcBehavior = function(a, b) {
            function g(a) {
                a.jsonrpc = "2.0", c.down.outgoing(d.stringify(a))
            }
            function h(a, b) {
                var c = Array.prototype.slice;
                return function() {
                    var d = arguments.length,
                        h, i = {
                            method: b
                        };
                    d > 0 && typeof arguments[d - 1] == "function" ? (d > 1 && typeof arguments[d - 2] == "function" ? (h = {
                        success: arguments[d - 2],
                        error: arguments[d - 1]
                    }, i.params = c.call(arguments, 0, d - 2)) : (h = {
                        success: arguments[d - 1]
                    }, i.params = c.call(arguments, 0, d - 1)), f["" + ++e] = h, i.id = e) : i.params = c.call(arguments, 0), a.namedParams && i.params.length === 1 && (i.params = i.params[0]), g(i)
                }
            }
            function j(a, b, c, d) {
                if (!c) {
                    b && g({
                        id: b,
                        error: {
                            code: -32601,
                            message: "Procedure not found."
                        }
                    });
                    return
                }
                var e, f;
                b ? (e = function(a) {
                    e = i, g({
                        id: b,
                        result: a
                    })
                }, f = function(a, c) {
                    f = i;
                    var d = {
                        id: b,
                        error: {
                            code: -32099,
                            message: a
                        }
                    };
                    c && (d.error.data = c), g(d)
                }) : e = f = i, u(d) || (d = [d]);
                try {
                    var h = c.method.apply(c.scope, d.concat([e, f]));
                    L(h) || e(h)
                } catch (j) {
                    f(j.message)
                }
            }
            var c, d = b.serializer || M(),
                e = 0,
                f = {};
            return c = {
                incoming: function(a, c) {
                    var e = d.parse(a);
                    if (e.method) b.handle ? b.handle(e, g) : j(e.method, e.id, b.local[e.method], e.params);
                    else {
                        var h = f[e.id];
                        e.error ? h.error && h.error(e.error) : h.success && h.success(e.result), delete f[e.id]
                    }
                },
                init: function() {
                    if (b.remote) for (var d in b.remote) b.remote.hasOwnProperty(d) && (a[d] = h(b.remote[d], d));
                    c.down.init()
                },
                destroy: function() {
                    for (var d in b.remote) b.remote.hasOwnProperty(d) && a.hasOwnProperty(d) && delete a[d];
                    c.down.destroy()
                }
            }
        }, g.easyXDM = n
    })(window, document, location, window.setTimeout, decodeURIComponent, encodeURIComponent)
});
define("app/utils/easy_xdm", ["module", "require", "exports", "$lib/easyXDM.js"], function(module, require, exports) {
    require("$lib/easyXDM.js"), module.exports = window.easyXDM.noConflict()
});
define("app/utils/sandboxed_ajax", ["module", "require", "exports", "core/utils", "app/utils/easy_xdm"], function(module, require, exports) {
    function remoteUrl(a, b) {
        var c = a.split("/").slice(-1);
        return /localhost/.test(window.location.hostname) ? "http://localhost.twitter.com:" + (window.cdnGoosePort || "1867") + "/" + c : b ? a : a.replace("https:", "http:")
    }
    function generateSocket(a) {
        return new easyXDM.Socket({
            remote: a,
            onMessage: function(a, b) {
                var c = JSON.parse(a),
                    d = requests[c.id];
                d && d.callbacks[c.callbackName] && d.callbacks[c.callbackName].apply(null, c.callbackArgs), c.callbackName === "complete" && delete requests[c.id]
            }
        })
    }
    function generateSandboxRequest(a) {
        var b = ++nextRequestId;
        a = utils.merge({}, a);
        var c = {
            id: b,
            callbacks: {
                success: a.success,
                error: a.error,
                before: a.before,
                complete: a.complete
            },
            request: {
                id: b,
                data: a
            }
        };
        return delete a.success, delete a.error, delete a.complete, delete a.before, requests[b] = c, c.request
    }
    var utils = require("core/utils"),
        easyXDM = require("app/utils/easy_xdm"),
        TIMEOUT = 5e3,
        nextRequestId = 0,
        requests = {}, sockets = [null, null],
        sandbox = {
            send: function(a, b) {
                var c = !! /^https:|^\/\//.test(b.url) || !! $.browser.msie,
                    d = c ? 0 : 1;
                sockets[d] || (sockets[d] = generateSocket(remoteUrl(a, c)));
                var e = generateSandboxRequest(b);
                sockets[d].postMessage(JSON.stringify(e))
            },
            easyXDM: easyXDM
        };
    module.exports = sandbox
});
provide("app/ui/media/with_legacy_icons", function(a) {
    using("core/i18n", function(_) {
        function b() {
            this.defaultAttrs({
                iconClass: "js-sm-icon",
                viewDetailsSelector: "span.js-view-details",
                hideDetailsSelector: "span.js-hide-details",
                iconContainerSelector: "span.js-icon-container"
            }), this.iconMap = {
                photo: ["sm-image", _('View photo'), _('Hide photo')],
                video: ["sm-video", _('View video'), _('Hide video')],
                song: ["sm-audio", _('View song'), _('Hide song')],
                album: ["sm-audio", _('View album'), _('Hide album')],
                tweet: ["sm-embed", _('View tweet'), _('Hide tweet')],
                generic: ["sm-embed", _('View media'), _('Hide media')],
                software: ["sm-embed", _('View app'), _('Hide app')]
            }, this.makeIcon = function(a, b) {
                var c = b.type.icon;
                typeof c == "function" && (c = c.call(b));
                var d = this.iconMap[c],
                    e = a.find(this.attr.iconContainerSelector),
                    f = $("<i/>", {
                        "class": this.attr.iconClass + " " + d[0]
                    });
                e.find("." + d[0]).length === 0 && e.append(f), a.find(this.attr.viewDetailsSelector).text(d[1]).end().find(this.attr.hideDetailsSelector).text(d[2]).end()
            }, this.addMediaIconsAndText = function(a, b) {
                b.forEach(this.makeIcon.bind(this, a))
            }
        }
        a(b)
    })
})
define("app/utils/third_party_application", ["module", "require", "exports", "app/utils/easy_xdm"], function(module, require, exports) {
    function getUserLinkColor() {
        if (!userLinkColor) {
            var a = $("<a>x</a>").appendTo($("body"));
            userLinkColor = a.css("color"), a.remove()
        }
        return userLinkColor
    }
    function socket(a, b, c) {
        var d = new easyXDM.Rpc({
            remote: b,
            container: a,
            props: {
                width: c.width || "100%",
                height: c.height || 0
            },
            onReady: function() {
                d.initialize({
                    htmlContent: "<div class='tweet-media'>" + c.htmlContent + "</div>",
                    styles: [
                        ["a", ["color", getUserLinkColor()]]
                    ]
                })
            }
        }, {
            local: {
                ui: function(b, c) {
                    b === "resizeFrame" && $(a).find("iframe").height(c)
                }
            },
            remote: {
                trigger: {},
                initialize: {}
            }
        });
        return d
    }
    function embedded(a, b, c) {
        return socket(a, b, c)
    }
    function sandboxed(a, b, c) {
        return /localhost/.test(b) && (b = b.replace("localhost.twitter.com", "localhost")), socket(a, b, c)
    }
    var easyXDM = require("app/utils/easy_xdm"),
        userLinkColor;
    module.exports = {
        embedded: embedded,
        sandboxed: sandboxed,
        easyXDM: easyXDM
    }
});
provide("app/ui/media/legacy_embed", function(a) {
    using("core/parameterize", "app/utils/third_party_application", function(b, c) {
        function d(a) {
            this.data = {}, this.url = a.url, this.slug = a.slug, this._name = a.type._name, this.constructor = a.type, this.process = this.constructor.process, this.getImageURL = this.constructor.getImageURL, this.metadata = this.constructor.metadata, this.icon = this.constructor.icon, this.calcHeight = function(a) {
                return Math.round(.75 * a)
            };
            for (var d in this.constructor.methods) typeof this.constructor.methods[d] == "function" && (this[d] = this.constructor.methods[d]);
            this.renderIframe = function(a, c) {
                var d = "<iframe src='" + c + "' width='{{width}}' height='{{height}}'></iframe>";
                a.append(b(d, this.data))
            }, this.renderEmbeddedApplication = function(a, b) {
                c.embedded(a.get(0), b, {
                    height: this.data.height,
                    width: this.data.width
                })
            }, this.type = function() {
                return typeof this.icon == "function" ? this.icon(this.url) : this.icon
            }, this.useOpaqueModeForFlash = function(a) {
                return a.replace(/(<\/object>)/, '<param name="wmode" value="opaque">$1').replace(/(<embed .*?)(\/?>)/, '$1 wmode="opaque"$2')
            }, this.resizeHtmlEmbed = function(a, b, c, d) {
                if (a && b && b.maxwidth && b.maxwidth < c) {
                    var e = Math.round(b.maxwidth * d / c);
                    a = a.replace(new RegExp('width=("?)' + c + "(?=\\D|$)", "g"), "width=$1" + b.maxwidth).replace(new RegExp('height=("?)' + d + "(?=\\D|$)", "g"), "height=$1" + e)
                }
                return a
            }
        }
        a(d)
    })
})
provide("app/ui/media/with_legacy_embeds", function(a) {
    using("core/i18n", "core/parameterize", "app/ui/media/legacy_embed", "app/utils/third_party_application", function(_, b, c, d) {
        function e() {
            this.defaultAttrs({
                tweetMedia: ".tweet-media",
                landingArea: ".js-landing-area"
            });
            var a = {
                attribution: '          <div class="media-attribution">            <img src="{{iconUrl}}">            <a href="{{href}}" class="media-attribution-link" target="_blank">{{typeName}}</a>          </div>',
                embedWrapper: '          <div class="tweet-media">            <div class="media-instance-container">              <div class="js-landing-area" style="min-height:{{minHeight}}px"></div>              {{flagAction}}              {{attribution}}            </div>          </div>',
                flagAction: '          <span class="flag-container">            <button type="button" class="flaggable btn-link">              {{flagThisMedia}}            </button>            <span class="flagged hidden">              {{flagged}}              <span>                <a target="_blank" href="//support.twitter.com/articles/20069937">                  {{learnMore}}                </a>              </span>            </span>          </span>'
            };
            this.assetPath = function(a) {
                return this.attr.assetsBasePath ? (a.charAt(0) == "/" && this.attr.assetsBasePath.charAt(this.attr.assetsBasePath.length - 1) == "/" ? a = a.substring(1) : a.charAt(0) != "/" && this.attr.assetsBasePath.charAt(this.attr.assetsBasePath.length - 1) != "/" && (a = "/" + a), this.attr.assetsBasePath + a) : a
            }, this.attributionIconUrl = function(a) {
                return a.attribution_icon || this.assetPath("/images/partner-favicons/" + a._name + ".png")
            }, this.isFlaggable = function(a) {
                return this.attr.loggedIn && a.type.flaggable
            }, this.assembleEmbedContainerHtml = function(c, d) {
                var e = this.isFlaggable(c) ? b(a.flagAction, {
                    flagThisMedia: _('Flag this media'),
                    flagged: _('Flagged'),
                    learnMore: _('(learn more)')
                }) : "",
                    f = b(a.attribution, {
                        iconUrl: this.attributionIconUrl(d),
                        typeName: d._name,
                        href: c.type.domain
                    });
                return b(a.embedWrapper, {
                    minHeight: c.type.height || 100,
                    attribution: f,
                    flagAction: e,
                    mediaClass: d._name.toLowerCase()
                })
            }, this.renderThirdPartyApplication = function(a, b) {
                d.sandboxed(a.get(0), this.embedSandboxPath, {
                    htmlContent: b
                })
            }, this.assembleEmbedInnerHtml = function(a, b, c) {
                b.content ? this.renderThirdPartyApplication(a, b.content.call(c)) : b.render.call(c, a)
            }, this.renderMediaType = function(a, b) {
                var d = new c(a),
                    e = $(this.assembleEmbedContainerHtml(a, d)),
                    f = function() {
                        var b = $("<div/>");
                        e.find(this.attr.landingArea).append(b), this.assembleEmbedInnerHtml(b, a.type, d), this.mediaTypeIsInteractive(a.type.icon) && e.data("interactive", !0).data("completeRender", f)
                    }.bind(this);
                return a.type.process.call(d, f, b), e
            }, this.buildEmbeddedMediaNodes = function(a, b) {
                return a.map(function(a) {
                    return this.renderMediaType(a, b)
                }, this)
            }, this.mediaTypeIsInteractive = function(a) {
                return a === "video" || a === "song"
            }, this.destroyInteractiveEmbed = function(a) {
                var b = $(a.target);
                b.find(this.attr.tweetMedia).data("interactive") && b.find(this.attr.landingArea).empty()
            }, this.rerenderInteractiveEmbed = function(a) {
                var b = $(a.target),
                    c = b.find(this.attr.tweetMedia).data("completeRender");
                c && b.find(this.attr.landingArea).is(":empty") && c()
            }, this.after("initialize", function(a) {
                this.embedSandboxPath = a.sandboxes && a.sandboxes.detailsPane;
                if (!this.embedSandboxPath) throw new Error("WithLegacyEmbeds requires options.sandboxes to be set");
                this.on("uiHasCollapsedTweet", this.destroyInteractiveEmbed), this.on("uiHasExpandedTweet", this.rerenderInteractiveEmbed)
            })
        }
        a(e)
    })
})
define("app/ui/media/with_flag_action", ["module", "require", "exports"], function(module, require, exports) {
    module.exports = function() {
        this.defaultAttrs({
            flagContainerSelector: ".flag-container",
            flaggableSelector: ".flaggable",
            flaggedSelector: ".flagged",
            tweetWithIdSelector: ".tweet[data-tweet-id]"
        }), this.flagMedia = function(a) {
            var b = $(a.target).closest(this.attr.flagContainerSelector),
                c = b.find(this.attr.flaggableSelector);
            if (!c.hasClass("hidden")) {
                var d = b.closest(this.attr.tweetWithIdSelector);
                d.attr("data-possibly-sensitive") ? this.trigger("uiFlagConfirmation", {
                    id: d.attr("data-tweet-id")
                }) : (this.trigger("uiFlagMedia", {
                    id: d.attr("data-tweet-id")
                }), b.find(this.attr.flaggableSelector).addClass("hidden"), b.find(this.attr.flaggedSelector).removeClass("hidden"))
            }
        }, this.after("initialize", function() {
            this.on("click", {
                flagContainerSelector: this.flagMedia
            })
        })
    }
});
define("app/ui/media/with_hidden_display", ["module", "require", "exports"], function(module, require, exports) {
    module.exports = function() {
        this.defaultAttrs({
            mediaNotDisplayedSelector: ".media-not-displayed",
            displayMediaSelector: ".display-this-media",
            alwaysDisplaySelector: ".always-display-media",
            entitiesContainerSelector: ".entities-media-container",
            cardsContainerSelector: ".cards-media-container",
            detailsFixerSelector: ".js-tweet-details-fixer"
        }), this.showMedia = function(a) {
            var b = $(a.target).closest(this.attr.detailsFixerSelector),
                c = [];
            this.attr.mediaContainerSelector && c.push(this.attr.mediaContainerSelector), this.attr.entitiesContainerSelector && c.push(this.attr.entitiesContainerSelector), this.attr.cardsContainerSelector && c.push(this.attr.cardsContainerSelector), b.find(this.attr.mediaNotDisplayedSelector).hide(), b.find(c.join(",")).removeClass("hidden")
        }, this.updateMediaSettings = function(a) {
            this.trigger("uiUpdateViewPossiblySensitive", {
                do_show: !0
            }), this.showMedia(a)
        }, this.after("initialize", function() {
            this.on("click", {
                displayMediaSelector: this.showMedia,
                alwaysDisplaySelector: this.updateMediaSettings
            })
        })
    }
});
provide("app/ui/media/with_legacy_media", function(a) {
    using("core/compose", "app/ui/media/types", "app/utils/sandboxed_ajax", "app/ui/media/with_legacy_icons", "app/ui/media/with_legacy_embeds", "app/ui/media/with_flag_action", "app/ui/media/with_hidden_display", "app/ui/media/legacy_embed", function(b, c, d, e, f, g, h, i) {
        function j() {
            b.mixin(this, [e, f, g, h]), this.defaultAttrs({
                linkSelector: "p.js-tweet-text a.twitter-timeline-link",
                generalTweetSelector: ".js-stream-tweet",
                insideProxyTweet: ".proxy-tweet-container *",
                wasAlreadyEmbedded: '[data-pre-embedded="true"]',
                mediaContainerSelector: ".js-tweet-media-container"
            }), this.matchLink = function(a, b, c) {
                var d = $(b),
                    e = d.data("expanded-url") || b.href,
                    f = this.matchUrl(e, c);
                if (f) return f.a = b, f.embedIndex = d.index(), f;
                c || this.trigger(b, "uiWantsLinkResolution", {
                    url: e
                })
            }, this.matchUrl = function(a, b) {
                if (this.alreadyMatched[a]) return this.alreadyMatched[a];
                var d = c.matchers;
                for (var e = 0, f = d.length; e < f; e++) {
                    var g = a.match(d[e][0]);
                    if (g && g.length) return this.alreadyMatched[a] = {
                        url: a,
                        slug: g[1],
                        type: c.mediaTypes[d[e][1]],
                        label: d[e][2]
                    }
                }
            }, this.resolveMedia = function(a, b, c, d) {
                if (!a.attr("data-url")) return b(!1, a);
                if (a.attr("data-resolved-url-" + c)) return b(!0, a);
                var e = this.matchUrl(a.attr("data-url"));
                if (e) {
                    var f = new i(e);
                    !f.getImageURL || d && f.type() != d ? b(!1, a) : f.getImageURL(c, function(d) {
                        d ? (a.attr("data-resolved-url-" + c, d), b(!0, a)) : b(!1, a)
                    })
                } else b(!1, a)
            }, this.addIconsAndSaveMediaType = function(a, b) {
                var c = $(b.a).closest(this.attr.generalTweetSelector);
                if (c.hasClass("has-cards")) return;
                this.addMediaIconsAndText(c, [b]), this.saveRecordWithIndex(b, b.index, c.data("embeddedMedia"))
            }, this.saveRecordWithIndex = function(a, b, c) {
                for (var d = 0; d < c.length; d++) if (b < c[d].index) {
                    c.splice(d, 0, a);
                    return
                }
                c.push(a)
            }, this.getMediaTypesAndIconsForTweet = function(a, b) {
                if ($(b).hasClass("has-cards")) return;
                $(b).data("embeddedMedia", []).find(this.attr.linkSelector).filter(function(a, b) {
                    var c = $(b);
                    return c.is(this.attr.insideProxyTweet) ? !1 : !c.is(this.attr.wasAlreadyEmbedded)
                }.bind(this)).map(this.matchLink.bind(this)).map(this.addIconsAndSaveMediaType.bind(this)), this.trigger($(b), "uiHasAddedLegacyMediaIcon")
            }, this.handleResolvedUrl = function(a, b) {
                $(a.target).data("expanded-url", b.url);
                var c = this.matchLink(null, a.target, !0);
                c && (this.addIconsAndSaveMediaType(null, c), this.trigger(a.target, "uiHasAddedLegacyMediaIcon"))
            }, this.inlineLegacyMediaEmbedsForTweet = function(a) {
                var b = $(a.target);
                if (b.hasClass("has-cards")) return;
                var c = b.find(this.attr.mediaContainerSelector),
                    d = b.data("embeddedMedia");
                d && this.buildEmbeddedMediaNodes(d, {
                    maxwidth: c.width()
                }).forEach(function(a) {
                    c.append(a)
                })
            }, this.addMediaToTweetsInElement = function(a) {
                $(a.target).find(this.attr.generalTweetSelector).each(this.getMediaTypesAndIconsForTweet.bind(this))
            }, this.after("initialize", function(a) {
                c.sandboxedAjax.send = function(b) {
                    d.send(a.sandboxes.jsonp, b)
                };
                if (!a.enable_instagram) for (var b = 0, e = c.matchers.length; b < e; b++) if (c.matchers[b][1] == "Instagram") {
                    c.matchers.splice(b, 1);
                    break
                }
                this.alreadyMatched = {}, this.on("uiHasInjectedTimelineItem", this.addMediaToTweetsInElement), this.on("uiWantsMediaForTweet", this.inlineLegacyMediaEmbedsForTweet), this.on("dataDidResolveUrl", this.handleResolvedUrl), this.addMediaToTweetsInElement({
                    target: this.$node
                })
            })
        }
        a(j)
    })
})
define("app/ui/media/with_native_media", ["module", "require", "exports"], function(module, require, exports) {
    function withNativeMedia() {
        this.defaultAttrs({
            expandedContentHolderWithPreloadableMedia: "div[data-expanded-footer].has-preloadable-media"
        }), this.preloadEmbeddedMedia = function(a) {
            $(a.target).find(this.attr.expandedContentHolderWithPreloadableMedia).each(function(a, b) {
                $("<div/>").append($(b).data("expanded-footer")).remove()
            })
        }, this.after("initialize", function() {
            this.preloadEmbeddedMedia({
                target: this.$node
            }), this.on("uiHasInjectedTimelineItem", this.preloadEmbeddedMedia)
        })
    }
    module.exports = withNativeMedia
});
provide("app/ui/media/media_tweets", function(a) {
    using("core/component", "app/ui/media/with_legacy_media", "app/ui/media/with_native_media", function(b, c, d) {
        var e = b(c, d);
        a(e)
    })
})