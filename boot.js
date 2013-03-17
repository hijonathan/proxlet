define("app/data/geo", ["module", "require", "exports", "core/component", "app/utils/cookie", "app/data/with_data"], function(module, require, exports) {
    function geo() {
        this.isInState = function(a) {
            return a.split(" ").indexOf(this.state) >= 0
        }, this.isEnabled = function(a) {
            return !this.isInState("disabled enabling enableIsUnavailable")
        }, this.setInitialState = function() {
            this.attr.geoEnabled ? this.state = Geo.webclientCookie() === "1" ? "enabledTurnedOn" : "enabledTurnedOff" : this.state = "disabled"
        }, this.requestState = function(a, b) {
            this.shouldLocate() ? this.locate() : this.sendState(this.state)
        }, this.shouldLocate = function() {
            return this.isInState("enabledTurnedOn locateIsUnavailable") || this.isInState("located locationUnknown") && (!this.lastLocationTime || this.now() - this.lastLocationTime > MIN_TIME_BETWEEN_LOCATES_IN_MS)
        }, this.locate = function(a) {
            this.sendState(a ? "changing" : "locating");
            var b = function(a) {
                this.sendState(this.locateOrEnableState(a) || "locateIsUnavailable")
            }.bind(this),
                c = function() {
                    this.sendState("locateIsUnavailable")
                }.bind(this),
                d = {
                    override_place_id: a
                };
            this.post({
                url: "/account/geo_locate",
                data: d,
                echoParams: {
                    spoof_ip: !0
                },
                eventData: d,
                success: b,
                error: c
            })
        }, this.locateOrEnableState = function(a) {
            switch (a.status) {
                case "ok":
                    return this.place_id = a.place_id, this.place_name = a.place_name, this.places_html = a.html, this.lastLocationTime = this.now(), "located";
                case "unknown":
                    return this.lastLocationTime = this.now(), "locationUnknown"
            }
        }, this.now = function() {
            return (new Date).getTime()
        }, this.sendState = function(a) {
            a && (this.state = a);
            var b = {
                state: this.state
            };
            this.state === "located" && (b.place_id = this.place_id, b.place_name = this.place_name, b.places_html = this.places_html), this.trigger("dataGeoState", b)
        }, this.turnOn = function() {
            this.isEnabled() && (Geo.webclientCookie("1"), this.locate())
        }, this.turnOff = function() {
            this.isEnabled() && (Geo.webclientCookie(null), this.sendState("enabledTurnedOff"))
        }, this.enable = function(a, b) {
            if (!this.isInState("disabled enableIsUnavailable")) return;
            this.sendState("enabling");
            var c = function(a) {
                Geo.webclientCookie("1"), this.sendState(this.locateOrEnableState(a) || "enableIsUnavailable")
            }.bind(this),
                d = function() {
                    this.sendState("enableIsUnavailable")
                }.bind(this);
            this.post({
                url: "/account/geo_locate",
                data: {
                    enable: "1"
                },
                echoParams: {
                    spoof_ip: !0
                },
                eventData: b,
                success: c,
                error: d
            })
        }, this.change = function(a, b) {
            this.isEnabled() && this.locate(b.placeId)
        }, this.search = function(a, b) {
            if (this.searching) {
                this.pendingSearchData = b;
                return
            }
            this.pendingSearchData = null;
            var c = function() {
                this.searching = !1;
                if (this.pendingSearchData) return this.search(a, this.pendingSearchData), !0
            }.bind(this),
                d = b.query.trim(),
                e = [d, b.placeId, b.isPrefix].join(","),
                f = function(a) {
                    this.searchCache[e] = a, a = $.extend({}, a, {
                        sourceEventData: b
                    }), c() || this.trigger("dataGeoSearchResults", a)
                }.bind(this),
                g = function() {
                    c() || this.trigger("dataGeoSearchResultsUnavailable")
                }.bind(this);
            if (!d) {
                f({
                    html: ""
                });
                return
            }
            var h = this.searchCache[e];
            if (h) {
                f(h);
                return
            }
            this.searching = !0, this.get({
                url: "/account/geo_search",
                data: {
                    query: d,
                    place_id: b.placeId,
                    is_prefix: b.isPrefix ? "1" : "0"
                },
                eventData: b,
                success: f,
                error: g
            })
        }, this.after("initialize", function() {
            this.searchCache = {}, this.setInitialState(), this.on("uiRequestGeoState", this.requestState), this.on("uiGeoPickerEnable", this.enable), this.on("uiGeoPickerTurnOn", this.turnOn), this.on("uiGeoPickerTurnOff", this.turnOff), this.on("uiGeoPickerChange", this.change), this.on("uiGeoPickerSearch", this.search)
        })
    }
    var defineComponent = require("core/component"),
        cookie = require("app/utils/cookie"),
        withData = require("app/data/with_data"),
        Geo = defineComponent(geo, withData),
        MIN_TIME_BETWEEN_LOCATES_IN_MS = 9e5;
    module.exports = Geo, Geo.webclientCookie = function(a) {
        return a === undefined ? cookie("geo_webclient") : cookie("geo_webclient", a, {
            expires: 3650,
            path: "/"
        })
    }
});
define("app/data/tweet", ["module", "require", "exports", "core/component", "app/data/with_auth_token", "core/i18n", "app/data/with_data"], function(module, require, exports) {
    function tweet() {
        this.IFRAME_TIMEOUT = 12e4, this.sendTweet = function(a, b) {
            var c = b.tweetboxId,
                d = function(a) {
                    a.tweetboxId = c, this.trigger("dataTweetSuccess", a), this.trigger("dataGotProfileStats", {
                        stats: a.profile_stats
                    })
                }, e = function(a) {
                    var b;
                    try {
                        b = a.message
                    } catch (d) {
                        b = {
                            error: _('Sorry! We did something wrong.')
                        }
                    }
                    b.tweetboxId = c, this.trigger("dataTweetError", b)
                };
            this.post({
                url: "/i/tweet/create",
                isMutation: !1,
                data: b.tweetData,
                success: d.bind(this),
                error: e.bind(this)
            })
        }, this.sendTweetWithMedia = function(a, b) {
            var c = b.tweetboxId,
                d = b.tweetData,
                e = this,
                f, g = function(a) {
                    a.tweetboxId = c, clearTimeout(f), a.error ? e.trigger("dataTweetError", a) : e.trigger("dataTweetSuccess", a)
                };
            window[c] = g.bind(this), f = setTimeout(function() {
                window[c] = function() {}, g({
                    error: _('Tweeting a photo timed out.')
                })
            }, this.IFRAME_TIMEOUT);
            var h = $("#" + b.tweetboxId),
                i = this.getAuthToken();
            h.find(".auth-token").val(i), h.find(".iframe-callback").val("window.top." + c), h.find(".in-reply-to-status-id").val(d.in_reply_to_status_id), h.find(".impression-id").val(d.impression_id), h.find(".earned").val(d.earned), h.submit()
        }, this.sendDirectMessage = function(a, b) {
            this.trigger("dataDirectMessageSuccess", b)
        }, this.after("initialize", function() {
            this.on("uiSendTweet", this.sendTweet), this.on("uiSendTweetWithMedia", this.sendTweetWithMedia), this.on("uiSendDirectMessage", this.sendDirectMessage)
        })
    }
    var defineComponent = require("core/component"),
        withAuthToken = require("app/data/with_auth_token"),
        _ = require("core/i18n"),
        withData = require("app/data/with_data"),
        Tweet = defineComponent(tweet, withAuthToken, withData);
    module.exports = Tweet
});
define("app/ui/tweet_dialog", ["module", "require", "exports", "core/component", "core/utils", "app/ui/with_dialog", "app/ui/with_position", "app/data/user_info", "core/i18n"], function(module, require, exports) {
    function tweetDialog() {
        this.defaultAttrs({
            tweetBoxSelector: "form.tweet-form",
            modalTweetSelector: ".modal-tweet",
            modalTitleSelector: ".modal-title"
        }), this.addTweet = function(a) {
            this.select("modalTweetSelector").show(), a.appendTo(this.select("modalTweetSelector"))
        }, this.removeTweet = function() {
            this.select("modalTweetSelector").hide().empty()
        }, this.openReply = function(a, b) {
            this.addTweet($(a.target).clone());
            var c = b.screenName;
            userInfo.getDecider("compose_9_reply_logic") && (c = b.screenNames[0]), this.openTweetDialog(a, utils.merge(b, {
                title: _('Reply to {{screenName}}', {
                    screenName: "@" + c
                })
            }))
        }, this.openGlobalTweetDialog = function(a, b) {
            this.openTweetDialog(a, utils.merge(b, {
                draftTweetId: "global"
            }))
        }, this.openTweetDialog = function(a, b) {
            this.setTitle(b && b.title || _('What\'s happening?'));
            if (b) {
                var c = null;
                b.screenNames ? c = b.screenNames : b.screenName && (c = [b.screenName]), c && (b.defaultText = "@" + c.join(" @") + " ", b.condensedText = _('Reply to {{screenNames}}', {
                    screenNames: b.defaultText
                })), this.trigger(document, "uiOverrideTweetBoxOptions", b)
            }
            this.open()
        }, this.setTitle = function(a) {
            this.select("modalTitleSelector").text(a)
        }, this.updateTitle = function(a, b) {
            b && b.title && this.setTitle(b.title)
        }, this.prepareTweetBox = function() {
            this.select("tweetBoxSelector").trigger("uiPrepareTweetBox")
        }, this.after("initialize", function() {
            this.on(document, "uiShortcutShowTweetbox", this.openGlobalTweetDialog), this.on(document, "uiOpenTweetDialog", this.openTweetDialog), this.on(document, "uiOpenReplyDialog", this.openReply), this.on("uiTweetSent", this.close), this.on("uiDialogOpened", this.prepareTweetBox), this.on("uiDialogClosed", this.removeTweet), this.on("uiDialogUpdateTitle", this.updateTitle)
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        withDialog = require("app/ui/with_dialog"),
        withPosition = require("app/ui/with_position"),
        userInfo = require("app/data/user_info"),
        _ = require("core/i18n"),
        TweetDialog = defineComponent(tweetDialog, withDialog, withPosition);
    module.exports = TweetDialog
});
define("app/ui/new_tweet_button", ["module", "require", "exports", "core/component"], function(module, require, exports) {
    function newTweetButton() {
        this.openTweetDialog = function() {
            this.trigger("uiOpenTweetDialog", {
                draftTweetId: "global"
            })
        }, this.after("initialize", function() {
            this.on("click", this.openTweetDialog)
        })
    }
    var defineComponent = require("core/component");
    module.exports = defineComponent(newTweetButton)
});
define("app/data/tweet_box_scribe", ["module", "require", "exports", "core/component", "app/data/with_scribe"], function(module, require, exports) {
    function tweetBoxScribe() {
        var a = {
            tweetBox: {
                uiTweetboxTweetError: "failure",
                uiTweetboxTweetSuccess: "send_tweet",
                uiTweetboxReplySuccess: "send_reply",
                uiTweetboxDMSuccess: "send_dm",
                uiOpenTweetDialog: "compose_tweet"
            },
            imagePicker: {
                uiImagePickerClick: "click",
                uiImagePickerAdd: "add",
                uiImagePickerRemove: "remove",
                uiImagePickerError: "error"
            },
            geoPicker: {
                uiGeoPickerOffer: "offer",
                uiGeoPickerEnable: "enable",
                uiGeoPickerOpen: "open",
                uiGeoPickerTurnOn: "on",
                uiGeoPickerTurnOff: "off",
                uiGeoPickerChange: "select",
                uiGeoPickerInteraction: "focus_field"
            }
        };
        this.after("initialize", function() {
            Object.keys(a.tweetBox).forEach(function(b) {
                this.scribeOnEvent(b, {
                    element: "tweet_box",
                    action: a.tweetBox[b]
                })
            }.bind(this)), Object.keys(a.imagePicker).forEach(function(b) {
                this.scribeOnEvent(b, {
                    element: "image_picker",
                    action: a.imagePicker[b]
                })
            }.bind(this)), Object.keys(a.geoPicker).forEach(function(b) {
                this.scribeOnEvent(b, {
                    element: "geo_picker",
                    action: a.geoPicker[b]
                })
            }.bind(this))
        })
    }
    var defineComponent = require("core/component"),
        withScribe = require("app/data/with_scribe");
    module.exports = defineComponent(tweetBoxScribe, withScribe)
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
define("app/ui/with_character_counter", ["module", "require", "exports", "lib/twitter-text"], function(module, require, exports) {
    function withCharacterCounter() {
        var a = 23;
        this.defaultAttrs({
            maxLength: 140,
            superwarnLength: 130,
            warnLength: 120,
            superwarnClass: "superwarn",
            warnClass: "warn"
        }), this.updateCounter = function() {
            var a = this.getLength();
            this.$counter.text(this.attr.maxLength - a).toggleClass(this.attr.warnClass, a >= this.attr.warnLength && a < this.attr.superwarnLength).toggleClass(this.attr.superwarnClass, a >= this.attr.superwarnLength)
        }, this.getLength = function(b) {
            return b === undefined && (b = this.val()), b !== this.prevCounterText && (this.prevCounterText = b, this.prevCounterLength = twitterText.getTweetLength(b)), this.prevCounterLength + (this.hasMedia ? a : 0)
        }, this.maxReached = function() {
            return this.getLength() > this.attr.maxLength
        }, this.after("initialize", function() {
            this.$counter = this.select("counterSelector"), this.on("uiTextChanged", this.updateCounter), this.updateCounter()
        })
    }
    var twitterText = require("lib/twitter-text");
    module.exports = withCharacterCounter
});
define("app/utils/with_event_params", ["module", "require", "exports", "core/utils", "core/parameterize"], function(module, require, exports) {
    function withEventParams() {
        this.rewriteEventName = function(a) {
            var b = util.toArray(arguments, 1),
                c = typeof b[0] == "string" || b[0].defaultBehavior ? 0 : 1,
                d = b[c],
                e = d.type || d;
            try {
                b[c] = parameterize(e, this.attr.eventParams, !0), d.type && (d.type = b[c], b[c] = d)
            } catch (f) {
                throw new Error("Couldn't parameterize the event name")
            }
            a.apply(this, b)
        }, this.around("on", this.rewriteEventName), this.around("off", this.rewriteEventName), this.around("trigger", this.rewriteEventName)
    }
    var util = require("core/utils"),
        parameterize = require("core/parameterize");
    module.exports = withEventParams
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
define("app/ui/with_draft_tweets", ["module", "require", "exports", "app/utils/storage/custom"], function(module, require, exports) {
    var customStorage = require("app/utils/storage/custom");
    module.exports = function() {
        this.defaultAttrs({
            draftTweetTTL: 864e5
        }), this.getDraftTweet = function() {
            return this.attr.draftTweetId && this.draftTweets().getItem(this.attr.draftTweetId)
        }, this.hasDraftTweet = function() {
            return !!this.getDraftTweet()
        }, this.loadDraftTweet = function() {
            var a = this.getDraftTweet();
            if (a) return this.val(a), !0
        }, this.saveDraftTweet = function(a, b) {
            if (this.attr.draftTweetId && this.hasFocus()) {
                var c = b.text.trim(); !! this.attr.defaultText && c === this.attr.defaultText.trim() || !! this.attr.condensedText && c === this.attr.condensedText.trim() || !c ? this.draftTweets().removeItem(this.attr.draftTweetId) : this.draftTweets().setItem(this.attr.draftTweetId, c, this.attr.draftTweetTTL)
            }
        }, this.clearDraftTweet = function() {
            this.attr.draftTweetId && (this.draftTweets().removeItem(this.attr.draftTweetId), this.resetTweetText())
        }, this.overrideDraftTweetId = function(a, b) {
            this.attr.draftTweetId = b.draftTweetId
        }, this.draftTweets = function() {
            if (!this.draftTweetsStore) {
                var a = customStorage({
                    withExpiry: !0
                });
                this.draftTweetsStore = new a("draft_tweets")
            }
            return this.draftTweetsStore
        }, this.around("resetTweetText", function(a) {
            this.loadDraftTweet() || a()
        }), this.initDraftTweets = function() {
            this.on("uiTextChanged", this.saveDraftTweet), this.on("ui{{type}}Sent", this.clearDraftTweet), this.attr.modal && this.on(document, "uiOverride{{type}}BoxOptions", this.overrideDraftTweetId)
        }
    }
});
define("app/ui/with_text_polling", ["module", "require", "exports"], function(module, require, exports) {
    function withTextPolling() {
        this.defaultAttrs({
            pollIntervalInMs: 100
        }), this.pollUpdatedText = function() {
            this.detectUpdatedText(), this.hasFocus() || this.stopPollingUpdatedText()
        }, this.startPollingUpdatedText = function() {
            this.detectUpdatedText(), this.pollUpdatedTextId === undefined && (this.pollUpdatedTextId = setInterval(this.pollUpdatedText.bind(this), this.attr.pollIntervalInMs))
        }, this.stopPollingUpdatedText = function() {
            this.pollUpdatedTextId !== undefined && (clearInterval(this.pollUpdatedTextId), delete this.pollUpdatedTextId)
        }, this.after("initialize", function() {
            this.on(this.$text, "focus", this.startPollingUpdatedText), this.hasFocus() && this.startPollingUpdatedText()
        }), this.before("teardown", function() {
            this.stopPollingUpdatedText()
        })
    }
    module.exports = withTextPolling
});
define("app/ui/with_rtl_tweet_box", ["module", "require", "exports", "lib/twitter-text", "app/utils/caret"], function(module, require, exports) {
    function replaceIndices(a, b, c) {
        var d = 0,
            e = "";
        return b(a).forEach(function(b) {
            e += a.slice(d, b.indices[0]) + c(a.slice(b.indices[0], b.indices[1])), d = b.indices[1]
        }), e + a.slice(d)
    }
    function withRTL() {
        this.defaultAttrs({
            isRTL: $("body").attr("dir") === "rtl",
            rtlCharRegex: /[\u0600-\u06FF]|[\u0750-\u077F]|[\u0590-\u05FF]|[\uFE70-\uFEFF]/gm,
            dirMarkRegex: /\u200e|\u200f/gm,
            rtlThreshold: .3
        }), this.shouldBeRTL = function(a, b, c) {
            c === undefined && (c = a.match(this.attr.rtlCharRegex));
            var d = a.trim();
            if (!d) return this.attr.isRTL;
            if (!c) return !1;
            var e = d.length - b;
            return e > 0 && c.length / e > this.attr.rtlThreshold
        }, this.removeMarkers = function(a) {
            return a.replace(this.attr.dirMarkRegex, "")
        }, this.setMarkersAndRTL = function(a, b) {
            var c = b.match(this.attr.rtlCharRegex),
                d = 0;
            if (c) {
                a = b, a = replaceIndices(a, txt.extractMentionsWithIndices, function(a) {
                    return d += a.length + 1, "â€Ž" + a + "â€"
                });
                var e = this.attr.rtlCharRegex;
                a = replaceIndices(a, txt.extractHashtagsWithIndices, function(a) {
                    return a[1].match(e) ? a : "â€Ž" + a
                }), a = replaceIndices(a, txt.extractUrlsWithIndices, function(a) {
                    return d += a.length + 2, a + "â€Ž"
                })
            }
            var f = this.shouldBeRTL(b, d, c);
            return this.$text.attr("dir", f ? "rtl" : "ltr"), a
        }, this.erasePastMarkers = function(a) {
            if (a.which === 8) var b = -1;
            else {
                if (a.which !== 46) return;
                var b = 0
            }
            var c = caret.getPosition(this.$text[0]),
                d = this.$text.val(),
                e = 0;
            do {
                var f = d[c + b] || "";
                f && (c += b, e++, d = d.slice(0, c) + d.slice(c + 1))
            } while (f.match(this.attr.dirMarkRegex));
            e > 1 && (this.$text.val(d), caret.setPosition(this.$text[0], c), a.preventDefault(), this.detectUpdatedText())
        }, this.cleanRtlText = function(a) {
            var b = this.removeMarkers(a),
                c = this.setMarkersAndRTL(a, b);
            if (c !== a) {
                var d = this.$text[0],
                    e = caret.getPosition(d);
                this.$text.val(c), this.prevText = c, caret.setPosition(d, e + c.length - a.length)
            }
            return b
        }, this.after("initTextNode", function() {
            this.on(this.$text, "keydown", this.erasePastMarkers)
        })
    }
    var txt = require("lib/twitter-text"),
        caret = require("app/utils/caret");
    module.exports = withRTL
});
define("app/ui/toolbar", ["module", "require", "exports", "core/component"], function(module, require, exports) {
    function toolbar() {
        this.defaultAttrs({
            buttonsSelector: ".btn:not([disabled])"
        }), this.current = -1, this.focusNext = function(a) {
            var b = this.select("buttonsSelector");
            this.current == -1 && (this.current = $.inArray(document.activeElement, b));
            var c, d = this.current;
            switch (a.which) {
                case 37:
                    d--;
                    break;
                case 39:
                    d++
            }
            c = b[d], c && (c.focus(), this.current = d)
        }, this.clearCurrent = function() {
            this.current = -1
        }, this.after("initialize", function() {
            this.$node.attr("role", "toolbar"), this.on("keydown", {
                buttonsSelector: this.focusNext
            }), this.on("focusout", this.clearCurrent)
        })
    }
    var defineComponent = require("core/component"),
        Toolbar = defineComponent(toolbar);
    module.exports = Toolbar
});
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
define("app/utils/html_text", ["module", "require", "exports"], function(module, require, exports) {
    function isTextNode(a) {
        return a.nodeType == 3 || a.nodeType == 4
    }
    function isElementNode(a) {
        return a.nodeType == 1
    }
    function isBrNode(a) {
        return isElementNode(a) && a.nodeName.toLowerCase() == "br"
    }
    function isOutsideContainer(a, b) {
        while (a !== b) {
            if (!a) return !0;
            a = a.parentNode
        }
    }
    var useW3CRange = window.getSelection,
        useMsftTextRange = !useW3CRange && document.selection,
        useIeHtmlFix = navigator.appName == "Microsoft Internet Explorer",
        NBSP_REGEX = /[\xa0\n\t]/g,
        CRLF_REGEX = /\r\n/g,
        LINES_REGEX = /(.*?)\n/g,
        SP_LEADING_OR_FOLLOWING_CLOSE_TAG_OR_PRECEDING_A_SP_REGEX = /^ |(<\/[^>]+>) | (?= )/g,
        SP_LEADING_OR_TRAILING_OR_FOLLOWING_A_SP_REGEX = /^ | $|( ) /g,
        MAX_OFFSET = Number.MAX_VALUE,
        htmlText = function(a, b) {
            function c(a, c) {
                function h(a) {
                    var i = d.length;
                    if (isTextNode(a)) {
                        var j = a.nodeValue.replace(NBSP_REGEX, " "),
                            k = j.length;
                        k && (d += j, e = !0), c(a, !0, 0, i, i + k)
                    } else if (isElementNode(a)) {
                        c(a, !1, 0, i, i);
                        if (isBrNode(a)) a == f ? g = !0 : (d += "\n", e = !1);
                        else {
                            var l = a.currentStyle || window.getComputedStyle(a, ""),
                                m = l.display == "block";
                            m && b.msie && (e = !0);
                            for (var n = a.firstChild, o = 1; n; n = n.nextSibling, o++) {
                                h(n);
                                if (g) return;
                                i = d.length, c(a, !1, o, i, i)
                            }
                            g || a == f ? g = !0 : m && e && (d += "\n", e = !1)
                        }
                    }
                }
                var d = "",
                    e, f, g;
                for (var i = a; i && isElementNode(i); i = i.lastChild) f = i;
                return h(a), d
            }
            function d(a, b) {
                var d = null,
                    e = b.length - 1;
                if (useW3CRange) {
                    var f = b.map(function() {
                        return {}
                    }),
                        g;
                    c(a, function(a, c, d, h, i) {
                        g || f.forEach(function(f, j) {
                            var k = b[j];
                            h <= k && !isBrNode(a) && (f.node = a, f.offset = c ? Math.min(k, i) - h : d, g = c && j == e && i >= k)
                        })
                    }), f[0].node && f[e].node && (d = document.createRange(), d.setStart(f[0].node, f[0].offset), d.setEnd(f[e].node, f[e].offset))
                } else if (useMsftTextRange) {
                    var h = document.body.createTextRange();
                    h.moveToElementText(a), d = h.duplicate();
                    if (b[0] == MAX_OFFSET) d.setEndPoint("StartToEnd", h);
                    else {
                        d.move("character", b[0]);
                        var i = e && b[1] - b[0];
                        i > 0 && d.moveEnd("character", i), h.inRange(d) || d.setEndPoint("EndToEnd", h)
                    }
                }
                return d
            }
            function e() {
                return a.offsetWidth && a.offsetHeight
            }
            function f(b) {
                a.innerHTML = b;
                if (useIeHtmlFix) for (var c = a.firstChild; c; c = c.nextSibling) isElementNode(c) && c.nodeName.toLowerCase() == "p" && c.innerHTML == "" && (c.innerText = "")
            }
            function g(a, b) {
                return a.map(function(a) {
                    return Math.min(a, b.length)
                })
            }
            function h() {
                var b = getSelection();
                if (b.rangeCount !== 1) return null;
                var d = b.getRangeAt(0);
                if (isOutsideContainer(d.commonAncestorContainer, a)) return null;
                var e = [{
                    node: d.startContainer,
                    offset: d.startOffset
                }];
                d.collapsed || e.push({
                    node: d.endContainer,
                    offset: d.endOffset
                });
                var f = e.map(function() {
                    return MAX_OFFSET
                }),
                    h = c(a, function(a, b, c, d) {
                        e.forEach(function(e, g) {
                            f[g] == MAX_OFFSET && a == e.node && (b || c == e.offset) && (f[g] = d + (b ? e.offset : 0))
                        })
                    });
                return g(f, h)
            }
            function i() {
                var b = document.selection.createRange();
                if (isOutsideContainer(b.parentElement(), a)) return null;
                var d = ["Start"];
                b.compareEndPoints("StartToEnd", b) && d.push("End");
                var e = d.map(function() {
                    return MAX_OFFSET
                }),
                    f = document.body.createTextRange(),
                    h = c(a, function(c, g, h, i) {
                        function j(a, c) {
                            if (e[c] < MAX_OFFSET) return;
                            var d = f.compareEndPoints("StartTo" + a, b);
                            if (d > 0) return;
                            var g = f.compareEndPoints("EndTo" + a, b);
                            if (g < 0) return;
                            var h = f.duplicate();
                            h.setEndPoint("EndTo" + a, b), e[c] = i + h.text.length, c && !g && e[c]++
                        }!g && !h && c != a && (f.moveToElementText(c), d.forEach(j))
                    });
                return g(e, h)
            }
            return {
                getHtml: function() {
                    if (useIeHtmlFix) {
                        var b = "",
                            c = document.createElement("div");
                        for (var d = a.firstChild; d; d = d.nextSibling) isTextNode(d) ? (c.innerText = d.nodeValue, b += c.innerHTML) : b += d.outerHTML.replace(CRLF_REGEX, "");
                        return b
                    }
                    return a.innerHTML
                },
                setHtml: function(a) {
                    f(a)
                },
                getText: function() {
                    return c(a, function() {})
                },
                setTextWithMarkup: function(a) {
                    f((a + "\n").replace(LINES_REGEX, function(a, c) {
                        return b.mozilla || b.msie ? (c = c.replace(SP_LEADING_OR_FOLLOWING_CLOSE_TAG_OR_PRECEDING_A_SP_REGEX, "$1&nbsp;"), b.mozilla ? c + "<BR>" : "<P>" + c + "</P>") : (c = (c || "<br>").replace(SP_LEADING_OR_TRAILING_OR_FOLLOWING_A_SP_REGEX, "$1&nbsp;"), b.opera ? "<p>" + c + "</p>" : "<div>" + c + "</div>")
                    }))
                },
                getSelectionOffsets: function() {
                    var a = null;
                    return e() && (useW3CRange ? a = h() : useMsftTextRange && (a = i())), a
                },
                setSelectionOffsets: function(b) {
                    if (b && e()) {
                        var c = d(a, b);
                        if (c) if (useW3CRange) {
                            var f = window.getSelection();
                            f.removeAllRanges(), f.addRange(c)
                        } else useMsftTextRange && c.select()
                    }
                },
                emphasizeText: function(b) {
                    var f = [];
                    b && b.length > 1 && e() && (c(a, function(a, c, d, e, g) {
                        if (c) {
                            var h = Math.max(e, b[0]),
                                i = Math.min(g, b[1]);
                            i > h && f.push([h, i])
                        }
                    }), f.forEach(function(b) {
                        var c = d(a, b);
                        c && (useW3CRange ? c.surroundContents(document.createElement("em")) : useMsftTextRange && c.execCommand("italic", !1, null))
                    }))
                }
            }
        };
    module.exports = htmlText
});
define("app/ui/with_rich_editor", ["module", "require", "exports", "app/utils/tweet_helper", "lib/twitter-text", "app/utils/html_text"], function(module, require, exports) {
    function withRichEditor() {
        this.defaultAttrs({
            richSelector: "div.rich-editor",
            linksSelector: "a",
            normalizerSelector: "div.rich-normalizer"
        }), this.linkify = function(a) {
            var b = {
                urlTarget: null,
                textWithSymbolTag: RENDER_URLS_AS_PRETTY_LINKS ? "b" : "",
                linkAttributeBlock: function(a, b) {
                    var c = a.screenName || a.url;
                    c && (this.urlAndMentionsCharCount += c.length + 2), delete b.title, delete b["data-screen-name"], b.dir = a.hashtag && this.shouldBeRTL(a.hashtag, 0) ? "rtl" : "ltr"
                }.bind(this)
            };
            return this.urlAndMentionsCharCount = 0, tweetHelper.linkify(a, b)
        }, this.around("setCursorPosition", function(a, b) {
            if (!this.isRich) return a(b);
            b === undefined && (b = this.attr.cursorPosition), b === undefined && (b = MAX_OFFSET), this.setSelectionIfFocused([b])
        }), this.around("detectUpdatedText", function(a, b, c) {
            if (!this.isRich) return a(b, c);
            if (this.$text.attr("data-in-composition")) return;
            var d = this.htmlRich.getHtml(),
                e = this.htmlRich.getSelectionOffsets() || [MAX_OFFSET];
            if (d === this.prevHtml && e[0] === this.prevSelectionOffset && !b && c === undefined) return;
            c === undefined && (c = this.htmlRich.getText());
            var f = c.replace(INVALID_CHARS, "");
            this.htmlNormalizer.setTextWithMarkup(this.linkify(f));
            var g = this.shouldBeRTL(f, this.urlAndMentionsCharCount);
            this.$text.attr("dir", g ? "rtl" : "ltr"), this.$normalizer.find(g ? "[dir=rtl]" : "[dir=ltr]").removeAttr("dir"), RENDER_URLS_AS_PRETTY_LINKS && this.$normalizer.find(".twitter-timeline-link").wrapInner("<b>").addClass("pretty-link");
            var h = this.getLength(f),
                i = this.attr.maxLength;
            if (h > i) {
                var j = [{
                    indices: [i, i]
                }];
                twitterText.modifyIndicesFromUnicodeToUTF16(f, j), this.htmlNormalizer.emphasizeText([j[0].indices[0], MAX_OFFSET]), this.$normalizer.find("em").each(function() {
                    this.innerHTML = this.innerHTML.replace(TRAILING_SINGLE_SPACE_REGEX, "Â ")
                })
            }
            var k = this.htmlNormalizer.getHtml();
            k !== d && (this.htmlRich.setHtml(k), this.setSelectionIfFocused(e)), this.prevHtml = k, this.prevSelectionOffset = e[0], this.updateCleanedTextAndOffset(f, e[0])
        }), this.setSelectionIfFocused = function(a) {
            this.hasFocus() && this.htmlRich.setSelectionOffsets(a)
        }, this.selectPrevCharOnBackspace = function(a) {
            if (a.which == 8) {
                var b = this.htmlRich.getSelectionOffsets();
                b && b[0] != MAX_OFFSET && b.length == 1 && (b[0] ? this.setSelectionIfFocused([b[0] - 1, b[0]]) : this.stopEvent(a))
            }
        }, this.emulateCommandArrow = function(a) {
            if (a.metaKey && !a.shiftKey && (a.which == 37 || a.which == 39)) {
                var b = a.which == 37;
                this.htmlRich.setSelectionOffsets([b ? 0 : MAX_OFFSET]), this.$text.scrollTop(b ? 0 : this.$text[0].scrollHeight), this.stopEvent(a)
            }
        }, this.stopEvent = function(a) {
            a.preventDefault(), a.stopPropagation()
        }, this.saveUndoStateDeferred = function(a) {
            a.type != "focus" && this.saveUndoState(), setTimeout(function() {
                this.detectUpdatedText(), this.saveUndoState()
            }.bind(this), 0)
        }, this.saveEmptyUndoState = function() {
            this.undoHistory = [
                ["", [0]]
            ], this.undoIndex = 0
        }, this.saveUndoState = function() {
            if (this.condensed) return;
            var a = this.htmlRich.getText(),
                b = this.htmlRich.getSelectionOffsets() || [a.length],
                c = this.undoHistory,
                d = c[this.undoIndex];
            (!d || d[0] !== a) && c.splice(++this.undoIndex, c.length, [a, b])
        }, this.isUndoKey = function(a) {
            return this.isMac ? a.which == 90 && a.metaKey && !a.shiftKey && !a.ctrlKey && !a.altKey : a.which == 90 && a.ctrlKey && !a.shiftKey && !a.altKey
        }, this.emulateUndo = function(a) {
            this.isUndoKey(a) && (this.stopEvent(a), this.saveUndoState(), this.undoIndex > 0 && this.setUndoState(this.undoHistory[--this.undoIndex]))
        }, this.isRedoKey = function(a) {
            return this.isMac ? a.which == 90 && a.metaKey && a.shiftKey && !a.ctrlKey && !a.altKey : this.isWin ? a.which == 89 && a.ctrlKey && !a.shiftKey && !a.altKey : a.which == 90 && a.shiftKey && a.ctrlKey && !a.altKey
        }, this.emulateRedo = function(a) {
            var b = this.undoHistory,
                c = this.undoIndex;
            c < b.length - 1 && this.htmlRich.getText() !== b[c][0] && b.splice(c + 1, b.length), this.isRedoKey(a) && (this.stopEvent(a), c < b.length - 1 && this.setUndoState(b[++this.undoIndex]))
        }, this.setUndoState = function(a) {
            this.detectUpdatedText(!1, a[0]), this.htmlRich.setSelectionOffsets(a[1]), this.trigger("uiHideAutocomplete")
        }, this.handleKeyDown = function(a) {
            $.browser.msie && this.selectPrevCharOnBackspace(a), $.browser.mozilla && this.emulateCommandArrow(a), this.emulateUndo(a), this.emulateRedo(a)
        }, this.rewritePastedLink = function(a) {
            setTimeout(function() {
                this.$text.find("a").each(function(a, b) {
                    var c = $(b),
                        d = c.attr("href");
                    b.attributes.length == 1 && d && twitterText.extractUrlsWithIndices(d).length == 1 && c.text(d)
                })
            }.bind(this), 0)
        }, this.clearSelectionOnBlur = function() {
            window.getSelection && (this.previousSelection = this.htmlRich.getSelectionOffsets(), this.previousSelection && getSelection().removeAllRanges())
        }, this.restoreSelectionOnFocus = function() {
            this.previousSelection && (this.htmlRich.setSelectionOffsets(this.previousSelection), this.previousSelection = null)
        }, this.around("initTextNode", function(a) {
            this.$text = this.select("richSelector");
            if (!this.$text.length) return a();
            this.isRich = !0, this.undoIndex = -1, this.undoHistory = [], this.htmlRich = htmlText(this.$text[0], $.browser), this.$normalizer = this.select("normalizerSelector"), this.htmlNormalizer = htmlText(this.$normalizer[0], $.browser);
            var b = navigator.platform;
            this.isMac = b.indexOf("Mac") != -1, this.isWin = b.indexOf("Win") != -1, this.on(this.$text, "click", {
                linksSelector: this.stopEvent
            }), this.on(this.$text, "keydown", this.handleKeyDown), $.browser.safari && this.on(this.$text, "paste", this.rewritePastedLink), this.on(this.$text, "cut paste drop focus", this.saveUndoStateDeferred), this.on(this.$text, "blur", this.clearSelectionOnBlur), this.on(this.$text, "focus", this.restoreSelectionOnFocus)
        })
    }
    var tweetHelper = require("app/utils/tweet_helper"),
        twitterText = require("lib/twitter-text"),
        htmlText = require("app/utils/html_text");
    module.exports = withRichEditor;
    var INVALID_CHARS = /[\uFFFE\uFEFF\uFFFF\u202A\u202B\u202C\u202D\u202E\x00]/g,
        RENDER_URLS_AS_PRETTY_LINKS = $.browser.mozilla && parseInt($.browser.version, 10) < 2,
        TRAILING_SINGLE_SPACE_REGEX = / $/,
        MAX_OFFSET = Number.MAX_VALUE
});
deferred('$lib/jquery.swfobject.js', function() {
    /*! jQuery SWFObject v1.1.1 MIT/GPL @jon_neal http://jquery.thewikies.com/swfobject */
    (function(a, b, c) {
        function d(a, b) {
            var c = (a[0] || 0) - (b[0] || 0);
            return c > 0 || !c && a.length > 0 && d(a.slice(1), b.slice(1))
        }
        function e(a) {
            if (typeof a != h) return a;
            var b = [],
                c = "";
            for (var d in a) c = typeof a[d] == h ? e(a[d]) : [d, i ? encodeURI(a[d]) : a[d]].join("="), b.push(c);
            return b.join("&")
        }
        function f(a) {
            var b = [];
            for (var c in a) a[c] && b.push([c, '="', a[c], '"'].join(""));
            return b.join(" ")
        }
        function g(a) {
            var b = [];
            for (var c in a) b.push(['<param name="', c, '" value="', e(a[c]), '" />'].join(""));
            return b.join("")
        }
        var h = "object",
            i = !0;
        try {
            var j = c.description || function() {
                    return (new c("ShockwaveFlash.ShockwaveFlash")).GetVariable("$version")
                }()
        } catch (k) {
            j = "Unavailable"
        }
        var l = j.match(/\d+/g) || [0];
        a[b] = {
            available: l[0] > 0,
            activeX: c && !c.name,
            version: {
                original: j,
                array: l,
                string: l.join("."),
                major: parseInt(l[0], 10) || 0,
                minor: parseInt(l[1], 10) || 0,
                release: parseInt(l[2], 10) || 0
            },
            hasVersion: function(a) {
                return a = /string|number/.test(typeof a) ? a.toString().split(".") : /object/.test(typeof a) ? [a.major, a.minor] : a || [0, 0], d(l, a)
            },
            encodeParams: !0,
            expressInstall: "expressInstall.swf",
            expressInstallIsActive: !1,
            create: function(a) {
                if (!a.swf || this.expressInstallIsActive || !this.available && !a.hasVersionFail) return !1;
                if (!this.hasVersion(a.hasVersion || 1)) {
                    this.expressInstallIsActive = !0;
                    if (typeof a.hasVersionFail == "function" && !a.hasVersionFail.apply(a)) return !1;
                    a = {
                        swf: a.expressInstall || this.expressInstall,
                        height: 137,
                        width: 214,
                        flashvars: {
                            MMredirectURL: location.href,
                            MMplayerType: this.activeX ? "ActiveX" : "PlugIn",
                            MMdoctitle: document.title.slice(0, 47) + " - Flash Player Installation"
                        }
                    }
                }
                attrs = {
                    data: a.swf,
                    type: "application/x-shockwave-flash",
                    id: a.id || "flash_" + Math.floor(Math.random() * 999999999),
                    width: a.width || 320,
                    height: a.height || 180,
                    style: a.style || ""
                }, i = typeof a.useEncode != "undefined" ? a.useEncode : this.encodeParams, a.movie = a.swf, a.wmode = a.wmode || "opaque", delete a.fallback, delete a.hasVersion, delete a.hasVersionFail, delete a.height, delete a.id, delete a.swf, delete a.useEncode, delete a.width;
                var b = document.createElement("div");
                return b.innerHTML = ["<object ", f(attrs), ">", g(a), "</object>"].join(""), b.firstChild
            }
        }, a.fn[b] = function(c) {
            var d = this.find(h).andSelf().filter(h);
            return /string|object/.test(typeof c) && this.each(function() {
                var d = a(this),
                    e;
                c = typeof c == h ? c : {
                    swf: c
                }, c.fallback = this;
                if (e = a[b].create(c)) d.children().remove(), d.html(e)
            }), typeof c == "function" && d.each(function() {
                var d = this;
                d.jsInteractionTimeoutMs = d.jsInteractionTimeoutMs || 0, d.jsInteractionTimeoutMs < 660 && (d.clientWidth || d.clientHeight ? c.call(d) : setTimeout(function() {
                    a(d)[b](c)
                }, d.jsInteractionTimeoutMs + 66))
            }), d
        }
    })(jQuery, "flash", navigator.plugins["Shockwave Flash"] || window.ActiveXObject)
});
define("app/utils/image", ["module", "require", "exports", "core/utils", "$lib/jquery.swfobject.js"], function(module, require, exports) {
    var utils = require("core/utils");
    require("$lib/jquery.swfobject.js");
    var image = {
        photoHelperSwfPath: "/t1/flash/PhotoHelper.swf",
        photoSelectorSwfPath: "/t1/flash/PhotoSelector.swf",
        MAX_FILE_SIZE: 3145728,
        validateFileName: function(a) {
            return /(.*)\.(jpg|jpeg|png|gif)/i.test(a)
        },
        validateImageSize: function(a, b) {
            var c = a.size || a.fileSize,
                b = b || this.MAX_FILE_SIZE;
            return !c || c <= b
        },
        getFileName: function(a) {
            if (a.indexOf("/") == -1 && a.indexOf("\\") == -1) return a;
            var b = a.match(/(?:.*)[\/\\]([^\/\\]+(?:\.\w+)?)$/);
            return b[1]
        },
        loadPhotoHelperSwf: function(a, b, c, d, e) {
            return a.flash({
                swf: this.photoHelperSwfPath,
                height: d,
                width: e,
                wmode: "transparent",
                AllowScriptAccess: "sameDomain",
                flashvars: {
                    callbackName: b,
                    errorCallbackName: c
                }
            }), a.find("object")
        },
        loadPhotoSelectorSwf: function(a, b, c, d, e, f) {
            return a.flash({
                swf: this.photoSelectorSwfPath,
                height: d,
                width: e,
                wmode: "transparent",
                AllowScriptAccess: "sameDomain",
                flashvars: {
                    callbackName: b,
                    errorCallbackName: c,
                    buttonWidth: e,
                    buttonHeight: d,
                    maxSizeInBytes: f
                }
            }), a.find("object")
        },
        hasFlash: function() {
            try {
                return $.flash.available && $.flash.hasVersion(10)
            } catch (a) {
                return !1
            }
        },
        hasFileReader: function() {
            return typeof FileReader == "function" || typeof FileReader == "object" ? !0 : !1
        },
        hasCanvas: function() {
            var a = document.createElement("canvas");
            return !!a.getContext && !! a.getContext("2d")
        },
        getFileHandle: function(a) {
            return a.files && a.files[0] ? a.files[0] : !1
        },
        shouldUseFlash: function() {
            return !this.hasFileReader() && this.hasFlash()
        },
        mode: function() {
            return this.hasFileReader() ? "html5" : this.hasFlash() ? "flash" : "html4"
        },
        getDataUri: function(a, b) {
            var c = "data:image/jpeg;base64," + a;
            return b && (c = "url(" + c + ")"), c
        },
        getFileData: function(a, b, c) {
            var d = new FileReader;
            d.onload = function(b) {
                var d = b.target.result;
                c(a, d)
            }, d.readAsDataURL(b)
        }
    };
    module.exports = image
});
define("app/ui/with_drop_events", ["module", "require", "exports", "app/utils/image"], function(module, require, exports) {
    function withDropEvents() {
        this.drop = function(a) {
            a.preventDefault(), a.stopImmediatePropagation();
            var b = image.getFileHandle(a.originalEvent.dataTransfer);
            this.trigger("uiDrop", {
                file: b
            }), this.trigger("uiDragEnd")
        }, this.after("initialize", function() {
            this.on("drop", this.drop)
        })
    }
    var image = require("app/utils/image");
    module.exports = withDropEvents
});
define("app/ui/with_droppable_image", ["module", "require", "exports", "core/compose", "app/ui/with_drop_events", "app/utils/image"], function(module, require, exports) {
    function withDroppableImage() {
        compose.mixin(this, [withDropEvents]), this.triggerGotImageData = function(a, b) {
            this.trigger("uiGotImageData", {
                name: a,
                contents: b
            })
        }, this.captureImageData = function(a, b) {
            var c = b.file;
            image.getFileData(c.name, c, this.triggerGotImageData.bind(this))
        }, this.after("initialize", function() {
            this.on("uiDrop", this.captureImageData)
        })
    }
    var compose = require("core/compose"),
        withDropEvents = require("app/ui/with_drop_events"),
        image = require("app/utils/image");
    module.exports = withDroppableImage
});
define("app/ui/tweet_box", ["module", "require", "exports", "core/component", "app/ui/with_character_counter", "app/utils/with_event_params", "app/utils/caret", "core/utils", "core/i18n", "app/utils/scribe_item_types", "app/ui/with_draft_tweets", "app/ui/with_text_polling", "app/ui/with_rtl_tweet_box", "app/ui/toolbar", "app/ui/with_rich_editor", "app/ui/with_droppable_image"], function(module, require, exports) {
    function tweetBox() {
        var a = _('Compose new Tweet...'),
            b = "";
        this.defaultAttrs({
            textSelector: "textarea.tweet-box",
            shadowTextSelector: ".tweet-box-shadow",
            counterSelector: "span.tweet-counter",
            toolbarSelector: ".js-toolbar",
            imageSelector: ".photo-selector",
            imageBtnSelector: ".photo-selector .btn",
            focusClass: "focus",
            fileInputSelector: ".file-input",
            thumbContainerSelector: ".thumbnail-container",
            tweetActionSelector: ".tweet-action",
            iframeSelector: ".tweet-post-iframe",
            placeIdSelector: "input[name=place_id]",
            cursorPosition: undefined,
            inReplyToTweetData: {},
            inReplyToStatusId: undefined,
            impressionId: undefined,
            disclosureType: undefined,
            modal: !1,
            condensable: !1,
            suppressFlashMessage: !1,
            customData: {},
            position: undefined,
            itemType: "tweet",
            component: undefined,
            eventParams: ""
        }), this.dmRegex = /^\s*(?:d|m|dm)\s+[@ï¼ ]?(\S+)\s*(.*)/i, this.validUserRegex = /^(\w{1,20})$/, this.dmMode = !1, this.hasMedia = !1, this.condensed = !1, this.sendTweet = function(a) {
            a && a.preventDefault(), this.detectUpdatedText(), this.$node.attr("id", this.getTweetboxId());
            var b = {
                status: this.val(),
                place_id: this.select("placeIdSelector").val(),
                in_reply_to_status_id: this.attr.inReplyToStatusId,
                impression_id: this.attr.impressionId,
                earned: this.attr.disclosureType ? this.attr.disclosureType == "earned" : undefined
            }, c = this.hasMedia ? "uiSend{{type}}WithMedia" : "uiSend{{type}}";
            this.trigger(c, {
                tweetboxId: this.getTweetboxId(),
                tweetData: b
            }), this.$node.addClass("tweeting"), this.disable()
        }, this.getTweetboxId = function() {
            return this.tweetboxId || (this.tweetboxId = "swift_tweetbox_" + +(new Date)), this.tweetboxId
        }, this.overrideTweetBoxOptions = function(a, b) {
            this.attr.inReplyToTweetData = b, b.id && (this.attr.inReplyToStatusId = b.id), b.impressionId && (this.attr.impressionId = b.impressionId), b.disclosureType && (this.attr.disclosureType = b.disclosureType), b.defaultText && (this.attr.defaultText = b.defaultText), b.customData && (this.attr.customData = b.customData), b.itemType && (this.attr.itemType = b.itemType), b.scribeContext && b.scribeContext.component && (this.attr.component = b.scribeContext.component), b.position !== undefined && (this.attr.position = b.position), b.cursorPosition !== undefined && (this.attr.cursorPosition = b.cursorPosition)
        }, this.resetOverriddenOptions = function(a, b) {
            delete this.attr.defaultText, this.attr.inReplyToTweetData = this.defaults.inReplyToTweetData, this.attr.inReplyToStatusId = this.defaults.inReplyToStatusId, this.attr.impressionId = this.defaults.impressionId, this.attr.disclosureType = this.defaults.disclosureType, this.attr.defaultText = this.getDefaultText(), this.attr.cursorPosition = this.defaults.cursorPosition, this.attr.customData = this.defaults.customData, this.attr.position = this.defaults.position, this.attr.itemType = this.defaults.itemType, this.attr.component = this.attr.component
        }, this.updateTweetTitleThenButton = function() {
            this.updateTitle(), this.updateTweetButton()
        }, this.updateTweetButton = function() {
            var a = !1,
                b = this.val().trim();
            this.hasMedia ? a = !0 : a = b && b !== this.attr.defaultText.trim();
            if (this.maxReached() || this.$node.hasClass("tweeting")) a = !1;
            this.dmMode && (!this.dmText || !this.dmUsername.match(this.validUserRegex)) && (a = !1), a ? this.enable() : this.disable()
        }, this.updateTweetButtonText = function(a) {
            this.select("tweetActionSelector").text(a)
        }, this.updateTitle = function() {
            var a = this.val().match(this.dmRegex),
                b = a && a[1];
            this.dmText = a && a[2], a && (!this.dmMode || this.dmMode && this.dmUsername != b) ? (this.dmMode = !0, this.dmUsername = b, this.trigger("uiDialogUpdateTitle", {
                title: _('Message @{{username}}', {
                    username: b
                })
            }), this.updateTweetButtonText(_('Send message'))) : this.dmMode && !a && (this.dmMode = !1, this.dmUsername = undefined, this.trigger("uiDialogUpdateTitle", {
                title: _('What\'s happening')
            }), this.updateTweetButtonText(_('Tweet')))
        }, this.tweetSent = function(a, b) {
            var c = b.tweetboxId || b.sourceEventData.tweetboxId;
            if (c != this.getTweetboxId()) return;
            b.customData = this.attr.customData, b.message && this.trigger(b.unusual ? "uiShowError" : "uiShowMessage", {
                message: b.message
            });
            if (this.attr.eventParams.type == "Tweet") {
                var d = "uiTweetboxTweetSuccess";
                if (this.attr.inReplyToStatusId || this.val().indexOf("@") == 0) {
                    if ((this.attr.inReplyToTweetData || {}).replyLinkClick) {
                        var e = utils.merge({}, this.attr.inReplyToTweetData);
                        e.scribeContext && (e.scribeContext.element = ""), this.trigger("uiReplyButtonTweetSuccess", e)
                    }
                    d = "uiTweetboxReplySuccess"
                } else this.val().match(this.dmRegex) && (d = "uiTweetboxDMSuccess");
                this.trigger(d, {
                    scribeData: {
                        item_ids: [b.tweet_id]
                    }
                })
            }
            this.$node.removeClass("tweeting"), this.trigger("ui{{type}}Sent", b), this.reset(), this.condense()
        }, this.scribeDataForReply = function() {
            var a = {
                id: this.attr.inReplyToStatusId,
                item_type: scribeItemTypes.tweet
            }, b = {};
            this.attr.impressionId && (a.token = this.attr.impressionId, b.promoted = !0);
            if (this.attr.position == 0 || this.attr.position) a.position = this.attr.position;
            return b.items = [a], {
                scribeData: b,
                scribeContext: {
                    component: this.attr.component,
                    element: ""
                }
            }
        }, this.tweetError = function(a, b) {
            var c = b.tweetboxId || b.sourceEventData.tweetboxId;
            if (c != this.getTweetboxId()) return;
            !this.attr.suppressFlashMessage && this.trigger("uiShowError", {
                message: b.error || b.message
            }), this.$node.removeClass("tweeting"), this.enable(), this.attr.eventParams.type == "Tweet" && this.trigger("uiTweetboxTweetError")
        }, this.detectUpdatedText = function(a, b) {
            b === undefined ? b = this.$text.val() : this.$text.val(b);
            if (b !== this.prevText || a) this.prevText = b, b = this.cleanRtlText(b), this.updateCleanedTextAndOffset(b, caret.getPosition(this.$text[0]))
        }, this.updateCleanedTextAndOffset = function(a, b) {
            this.cleanedText = a, this.select("shadowTextSelector").val(a), this.trigger("uiTextChanged", {
                text: a,
                position: b,
                condensed: this.condensed
            }), this.updateTweetTitleThenButton()
        }, this.showPreview = function(a, b) {
            this.$node.addClass("has-preview"), b.imageData && this.$node.addClass("has-thumbnail"), this.hasMedia = !0, this.detectUpdatedText(!0)
        }, this.hidePreview = function(a, b) {
            this.$node.removeClass("has-preview has-thumbnail"), this.hasMedia = !1, this.detectUpdatedText(!0)
        }, this.enable = function() {
            this.select("tweetActionSelector").removeClass("disabled").attr("disabled", !1)
        }, this.disable = function() {
            this.select("tweetActionSelector").addClass("disabled").attr("disabled", !0)
        }, this.reset = function(a) {
            this.focus(), this.freezeTweetText || this.resetTweetText(), this.setCursorPosition(), this.trigger("ui{{type}}BoxHidePreview"), this.$text.css("height", ""), this.$node.find("input[type=hidden]").val("")
        }, this.val = function(a) {
            if (a == undefined) return this.cleanedText || "";
            this.detectUpdatedText(!1, a)
        }, this.setCursorPosition = function(a) {
            a === undefined && (a = this.attr.cursorPosition), a === undefined && (a = this.$text.val().length), caret.setPosition(this.$text.get(0), a)
        }, this.focus = function() {
            this.hasFocus() || this.$text.focus()
        }, this.expand = function() {
            this.$node.removeClass("condensed"), this.condensed && (this.condensed = !1, this.trigger("uiTweetBoxExpanded"), this.trigger("uiPrepareTweetBox"))
        }, this.forceExpand = function() {
            this.condensed = !0, this.expand(), this.saveEmptyUndoState()
        }, this.condense = function() {
            !this.condensed && this.attr.condensable && (this.$node.addClass("condensed"), this.condensed = !0, this.resetTweetText(), this.$text.blur(), this.trigger("uiTweetBoxCondensed"))
        }, this.condenseEmptyTweet = function() {
            this.detectUpdatedText();
            var a = this.val().trim();
            this.trigger("uiHideAutocomplete"), (a == this.attr.defaultText.trim() || a == "") && !this.hasMedia && this.condense()
        }, this.condenseOnMouseDown = function(a) {
            this.condensed || ($.contains(this.node, a.target) ? this.blockCondense = !0 : this.condenseEmptyTweet())
        }, this.condenseOnBlur = function(a) {
            if (this.blockCondense) {
                this.blockCondense = !1;
                return
            }
            this.condenseEmptyTweet()
        }, this.hasFocus = function() {
            return document.activeElement === this.$text[0]
        }, this.prepareTweetBox = function() {
            this.reset()
        }, this.resetTweetText = function() {
            this.val(this.condensed ? this.attr.condensedText : this.attr.defaultText)
        }, this.getDefaultText = function() {
            return typeof this.attr.defaultText != "undefined" ? this.attr.defaultText : this.getAttrOrElse("data-default-text", b)
        }, this.getCondensedText = function() {
            return typeof this.attr.condensedText != "undefined" ? this.attr.condensedText : this.getAttrOrElse("data-condensed-text", a)
        }, this.changeTextAndPosition = function(a, b) {
            this.val(b.text), this.setCursorPosition(b.position)
        }, this.getAttrOrElse = function(a, b) {
            return typeof this.$node.attr(a) == "undefined" ? b : this.$node.attr(a)
        }, this.toggleFocusStyle = function(a) {
            this.select("imageBtnSelector").toggleClass(this.attr.focusClass)
        }, this.initTextNode = function() {
            this.$text = this.select("textSelector")
        }, this.after("initialize", function() {
            this.attr.defaultText = this.getDefaultText(), this.attr.condensedText = this.getCondensedText(), utils.push(this.attr, {
                eventData: {
                    scribeContext: {
                        element: "tweet_box"
                    }
                }
            }, !1), this.initTextNode(), this.on(this.select("tweetActionSelector"), "click", this.sendTweet), this.on(document, "data{{type}}Success", this.tweetSent), this.on(document, "data{{type}}Error", this.tweetError), this.on(this.$text, "dragover", this.focus), this.on("ui{{type}}BoxShowPreview", this.showPreview), this.on("ui{{type}}BoxHidePreview", this.hidePreview), this.on("ui{{type}}BoxReset", this.reset), this.on("uiPrepare{{type}}Box", this.prepareTweetBox), this.on("uiExpandFocus", this.focus), this.on("uiChangeTextAndPosition", this.changeTextAndPosition), this.on("focusin", {
                fileInputSelector: this.toggleFocusStyle
            }), this.on("focusout", {
                fileInputSelector: this.toggleFocusStyle
            }), Toolbar.attachTo(this.select("toolbarSelector"), {
                buttonsSelector: ".file-input, .geo-picker-btn, .tweet-action"
            }), this.attr.modal && (this.on(document, "uiOverride{{type}}BoxOptions", this.overrideTweetBoxOptions), this.on("uiDialogClosed", this.resetOverriddenOptions)), this.initDraftTweets();
            var a = this.hasFocus();
            this.attr.condensable && (this.on(this.$text, "focus", this.expand), this.on(this.$text, "blur", this.condenseOnBlur), this.on(document, "mousedown", this.condenseOnMouseDown), a || (this.hasDraftTweet() ? this.forceExpand() : this.condense())), a && (this.freezeTweetText = !0, this.forceExpand(), this.freezeTweetText = !1)
        })
    }
    var defineComponent = require("core/component"),
        withCounter = require("app/ui/with_character_counter"),
        withEventParams = require("app/utils/with_event_params"),
        caret = require("app/utils/caret"),
        utils = require("core/utils"),
        _ = require("core/i18n"),
        scribeItemTypes = require("app/utils/scribe_item_types"),
        withDraftTweets = require("app/ui/with_draft_tweets"),
        withTextPolling = require("app/ui/with_text_polling"),
        withRTL = require("app/ui/with_rtl_tweet_box"),
        Toolbar = require("app/ui/toolbar"),
        withRichEditor = require("app/ui/with_rich_editor"),
        withDroppableImage = require("app/ui/with_droppable_image"),
        TweetBox = defineComponent(tweetBox, withCounter, withEventParams, withTextPolling, withRTL, withDraftTweets, withRichEditor, withDroppableImage);
    TweetBox.caret = caret, module.exports = TweetBox
});
define("app/utils/image_thumbnail", ["module", "require", "exports", "app/utils/image"], function(module, require, exports) {
    var image = require("app/utils/image"),
        imageThumbnail = {
            createThumbnail: function(a, b, c) {
                var d = new Image;
                d.onload = function() {
                    c(a, d, d.height, d.width)
                }, d.src = image.getDataUri(b)
            },
            getThumbnailOffset: function(a, b, c) {
                var d;
                if (b == a && b >= c && a >= c) return {
                    position: "absolute",
                    height: c,
                    width: c,
                    left: 0,
                    top: 0
                };
                if (a < c || b < c) d = {
                    position: "absolute",
                    height: a,
                    width: b,
                    top: (c - a) / 2,
                    left: (c - b) / 2
                };
                else if (b > a) {
                    var e = c / a * b;
                    d = {
                        position: "absolute",
                        height: c,
                        width: e,
                        left: -(e - c) / 2,
                        top: 0
                    }
                } else if (a > b) {
                    var f = c / b * a;
                    d = {
                        position: "absolute",
                        height: f,
                        width: c,
                        top: -(f - c) / 2,
                        left: 0
                    }
                }
                return d
            }
        };
    module.exports = imageThumbnail
});
define("app/ui/tweet_box_thumbnails", ["module", "require", "exports", "core/component", "core/utils", "app/utils/image", "app/utils/image_thumbnail"], function(module, require, exports) {
    function tweetBoxThumbnails() {
        this.defaults = {
            thumbSelector: ".preview",
            thumbImageSelector: ".preview img",
            filenameSelector: ".preview .filename",
            dismissSelector: ".dismiss",
            tweetBoxSelector: ".tweet-form"
        }, this.showPreview = function(a, b) {
            b.imageData && imageThumbnail.createThumbnail(b.fileName, b.imageData, this.gotThumbnail.bind(this)), this.select("filenameSelector").text(b.fileName)
        }, this.hidePreview = function() {
            this.select("filenameSelector").empty(), this.select("thumbImageSelector").remove()
        }, this.gotThumbnail = function(a, b, c, d) {
            var e = imageThumbnail.getThumbnailOffset(c, d, 48);
            $(b).css(e), this.select("thumbSelector").append($(b))
        }, this.removeImage = function() {
            this.hidePreview(), this.trigger("uiTweetBoxRemoveImage"), this.trigger("uiImagePickerRemove")
        }, this.after("initialize", function() {
            utils.push(this.attr, {
                eventData: {
                    scribeContext: {
                        element: "image_picker"
                    }
                }
            }, !1);
            var a = this.$node.closest(this.attr.tweetBoxSelector);
            this.on(a, "uiTweetBoxShowPreview", this.showPreview), this.on(a, "uiTweetBoxHidePreview", this.hidePreview), this.on(this.select("dismissSelector"), "click", this.removeImage)
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        image = require("app/utils/image"),
        imageThumbnail = require("app/utils/image_thumbnail"),
        TweetBoxThumbnails = defineComponent(tweetBoxThumbnails);
    module.exports = TweetBoxThumbnails
});
define("app/utils/image_resize", ["module", "require", "exports", "app/utils/image"], function(module, require, exports) {
    var image = require("app/utils/image"),
        imageResize = {
            resize: function(a, b, c, d) {
                if (!image.hasCanvas()) return d(a, b.split(";base64,")[1]);
                var e = new Image,
                    f = document.createElement("canvas"),
                    g = f.getContext("2d");
                e.onload = function() {
                    if (e.width == 0 || e.height == 0) {
                        d(a, !1);
                        return
                    }
                    if (e.width < c && e.height < c) {
                        d(a, b.split(";base64,")[1]);
                        return
                    }
                    var h, i;
                    e.width > e.height ? (h = c, i = e.height / e.width * c) : (i = c, h = e.width / e.height * c), f.width = h, f.height = i, g.drawImage(e, 0, 0, h, i);
                    var j = f.toDataURL("image/jpeg");
                    d(a, j.split("data:image/jpeg;base64,")[1])
                }, e.onerror = function() {
                    d(a, !1)
                }, e.src = b
            }
        };
    module.exports = imageResize
});
define("app/ui/with_image_selection", ["module", "require", "exports", "app/utils/image", "app/utils/image_resize", "app/utils/image_thumbnail", "core/utils", "core/i18n"], function(module, require, exports) {
    function withImageSelection() {
        this.resize = imageResize.resize.bind(image), this.getFileData = image.getFileData.bind(image), this.getFileHandle = image.getFileHandle.bind(image), this.getFileName = image.getFileName.bind(image), this.validateFileName = image.validateFileName.bind(image), this.validateImageSize = image.validateImageSize.bind(image), this.defaultAttrs({
            swfSelector: ".swf-container",
            fileNameSelector: "input.file-name",
            fileDataSelector: "input.file-data",
            fileSelector: "input.file-input",
            buttonSelector: ".btn",
            fileNameString: "media_file_name",
            fileDataString: "media_data[]",
            fileInputString: "media[]",
            uploadType: "",
            maxSizeInBytes: 3145728
        }), this.validateImage = function(a, b) {
            return this.validateFileName(a) ? b && !this.validateImageSize(b, this.maxSizeInBytes) ? (this.addFileError("tooLarge"), !1) : !0 : (this.addFileError("notImage"), !1)
        }, this.imageSelected = function(a) {
            var b = this.select("fileSelector").get(0),
                c = this.getFileName(b.value),
                d = this.getFileHandle(b);
            if (!this.validateImage(c, d)) return;
            this.gotFileHandle(c, d)
        }, this.gotFileHandle = function(a, b) {
            this.mode() == "html5" ? this.getFileData(a, b, this.gotImageData.bind(this)) : this.gotFileInput(a)
        }, this.reset = function() {
            this.resetInput(), this.select("fileDataSelector").replaceWith('<input type="hidden" name="media_data_empty" class="file-data">'), this.trigger("uiTweetBoxHidePreview")
        }, this.gotFlashImageData = function(a, b, c) {
            if (!this.validateFileName(a)) {
                this.addFileError("notImage");
                return
            }
            this.showPreview({
                imageData: c,
                fileName: a
            }), this.trigger("uiImagePickerAdd", {
                message: "flash"
            }), this.readyFileData(b), this.trigger("uiImagePickerFileReady", {
                uploadType: this.attr.uploadType
            })
        }, this.gotFlashImageError = function(a, b) {
            this.addFileError(a)
        }, this.gotResizedImageData = function(a, b) {
            if (!b) {
                this.addFileError("notImage");
                return
            }
            this.showPreview({
                imageData: b,
                fileName: a
            }), this.trigger("uiImagePickerAdd", {
                message: "html5"
            });
            var c = b.split(",");
            c.length > 1 && (b = c[1]), this.readyFileData(b), this.trigger("uiImagePickerFileReady", {
                uploadType: this.attr.uploadType
            })
        }, this.gotFileInput = function(a) {
            this.showPreview({
                fileName: a
            }), this.trigger("uiImagePickerAdd", {
                message: "html4"
            }), this.readyFileInput(), this.trigger("uiImagePickerFileReady", {
                uploadType: this.attr.uploadType
            })
        }, this.readyFileInput = function() {
            this.select("fileSelector").attr("name", this.attr.fileInputString)
        }, this.readyFileData = function(a) {
            this.select("fileDataSelector").attr("name", this.attr.fileDataString), this.select("fileDataSelector").attr("value", a), this.resetInput()
        }, this.resetInput = function() {
            this.select("fileSelector").replaceWith('<input type="file" name="media_empty" class="file-input" tabindex="-1">')
        }, this.showPreview = function(a) {
            this.trigger("uiTweetBoxShowPreview", a)
        }, this.setupFlash = function() {
            var a = "swift_tweetbox_callback_" + +(new Date),
                b = "swift_tweetbox_error_callback_" + +(new Date);
            window[a] = this.gotFlashImageData.bind(this), window[b] = this.gotFlashImageError.bind(this), setTimeout(function() {
                this.loadSwf(a, b)
            }.bind(this), 500)
        }, this.mode = function() {
            return this.attr.forceHTML5FileUploader && (this._mode = "html5"), this._mode = this._mode || image.mode(), this._mode
        }, this.setup = function() {
            this.mode() == "flash" && this.setupFlash(), this.select("fileNameSelector").attr("name", this.attr.fileNameString), this.select("fileDataSelector").attr("name", this.attr.fileDataString), this.select("fileSelector").attr("name", this.attr.fileInputString)
        }, this.after("initialize", function() {
            this.setup(), this.on("change", this.imageSelected)
        })
    }
    var image = require("app/utils/image"),
        imageResize = require("app/utils/image_resize"),
        imageThumbnail = require("app/utils/image_thumbnail"),
        utils = require("core/utils"),
        _ = require("core/i18n");
    module.exports = withImageSelection
});
define("app/ui/image_selector", ["module", "require", "exports", "core/component", "app/utils/image", "app/utils/image_resize", "app/utils/image_thumbnail", "app/ui/with_image_selection", "core/utils", "core/i18n"], function(module, require, exports) {
    function imageSelector() {
        this.defaults = {
            swfHeight: 30,
            swfWidth: 42,
            tweetBoxSelector: ".tweet-form",
            photoButtonSelector: ".file-input"
        }, this.resetAndHidePreview = function() {
            this.reset(), this.trigger("uiTweetBoxHidePreview")
        }, this.disable = function() {
            this.$node.addClass("disabled"), this.select("buttonSelector").attr("disabled", !0).addClass("active")
        }, this.enable = function() {
            this.$node.removeClass("disabled"), this.select("buttonSelector").attr("disabled", !1).removeClass("active")
        }, this.gotImageData = function(a, b) {
            this.resize(a, b, 2048, this.gotResizedImageData.bind(this))
        }, this.interceptGotImageData = function(a, b) {
            this.gotImageData(b.name, b.contents)
        }, this.addFileError = function(a) {
            a == "tooLarge" ? this.trigger("uiShowError", {
                message: _('The file you selected is greater than the 3MB limit.')
            }) : (a == "notImage" || a == "ioError") && this.trigger("uiShowError", {
                message: _('You did not select an image.')
            }), this.trigger("uiImagePickerError", {
                message: a
            }), this.reset()
        }, this.loadSwf = function(a, b) {
            image.loadPhotoHelperSwf(this.select("swfSelector"), a, b, this.attr.swfHeight, this.attr.swfWidth)
        }, this.imageSelectorClicked = function(a, b) {
            this.trigger("uiImagePickerClick")
        }, this.after("initialize", function() {
            this.on(this.attr.photoButtonSelector, "click", this.imageSelectorClicked);
            var a = this.$node.closest(this.attr.tweetBoxSelector);
            this.on(a, "uiTweetBoxHidePreview", this.enable), this.on(a, "uiTweetBoxShowPreview", this.disable), this.on(a, "uiTweetBoxRemoveImage", this.resetAndHidePreview), this.on(a, "uiGotImageData", this.interceptGotImageData)
        })
    }
    var defineComponent = require("core/component"),
        image = require("app/utils/image"),
        imageResize = require("app/utils/image_resize"),
        imageThumbnail = require("app/utils/image_thumbnail"),
        withImageSelection = require("app/ui/with_image_selection"),
        utils = require("core/utils"),
        _ = require("core/i18n"),
        ImageSelector = defineComponent(imageSelector, withImageSelection);
    module.exports = ImageSelector
});
define("app/ui/with_autocomplete_helpers", ["module", "require", "exports", "app/utils/caret"], function(module, require, exports) {
    function withAutocompleteHelpers() {
        this.defaultAttrs({
            wordsRegExp: /\S+\s?/g,
            inputPrefix: "@",
            inputSuffix: " ",
            autocompleteResultsSelector: "ul.autocomplete-results",
            manageTextChanges: !0
        });
        var a = "",
            b = {
                9: function(a) {
                    a.trigger("uiAutocompleteItemSelected")
                },
                13: function(a) {
                    a.trigger(a.attr.selectedItemSelector, "uiAutocompleteEnter")
                },
                27: function(a) {
                    a.trigger("uiHideAutocomplete")
                },
                38: function(a) {
                    a.trigger("uiMoveSelectionUp")
                },
                40: function(a) {
                    a.trigger("uiMoveSelectionDown")
                }
            };
        this.notifyTextChanged = function(c, d) {
            if (c.type == "keydown" && this.resultsVisible() && b[c.which]) c.preventDefault(), c.which == 9 && b[c.which](this);
            else if (c.type != "keydown") if (this.resultsVisible() && b[c.which]) b[c.which](this);
            else if (this.attr.manageTextChanges && !this.$input.is(".rich-editor")) {
                var e = $(c.target).val();
                e != a && ($(c.target).trigger("uiTextChanged", {
                    text: e,
                    position: caret.getPosition(c.target)
                }), a = e)
            }
        }, this.replaceWordAtPosition = function(a, b, c) {
            return a.replace(this.attr.wordsRegExp, function(a, d) {
                return d <= b && d + a.length >= b ? c : a
            })
        }, this.getDropdownId = function() {
            return this.attr.dropdownId || (this.attr.dropdownId = "swift_autocomplete_dropdown_" + +(new Date)), this.attr.dropdownId
        }, this.updateWithSelection = function(a, b) {
            this.select("autocompleteResultsSelector").hide(), this.$input.focus();
            var c = this.position || 0,
                d = this.text || "",
                e = this.attr.inputPrefix + b.screen_name + this.attr.inputSuffix;
            d = this.replaceWordAtPosition(d, c, e);
            var f = d.indexOf(" ", c) + 1;
            f < 0 && (f = d.length), this.$input.trigger("uiChangeTextAndPosition", {
                text: d,
                position: f
            })
        }, this.saveTextAndPosition = function(a, b) {
            if (b.position == Number.MAX_VALUE) return;
            this.text = b.text, this.position = b.position
        }, this.changeTextAndPosition = function(a, b) {
            this.$input.val(b.text), caret.setPosition(this.$input[0], b.position), this.$input[0].selectionEnd = b.position
        }, this.after("initialize", function() {
            this.$input = this.select("autocompleteInputSelector"), this.on(this.attr.autocompleteInputSelector, "keydown keyup paste", this.notifyTextChanged), this.on("uiSendAutocompleteData", this.updateWithSelection), this.on("uiTextChanged", this.saveTextAndPosition), this.attr.manageTextChanges && this.on("uiChangeTextAndPosition", this.changeTextAndPosition)
        })
    }
    var caret = require("app/utils/caret");
    module.exports = withAutocompleteHelpers
});
provide("app/utils/string", function(a) {
    function b(a) {
        var b = a.charCodeAt(0);
        return b <= 32 ? !0 : !1
    }
    function c(a) {
        var b = a.charCodeAt(0);
        return b >= 48 && b <= 57 ? !0 : !1
    }
    function d(a, b) {
        var d = 0,
            e = 0,
            f = 0,
            g, h;
        for (;; e++, f++) {
            g = a.charAt(e), h = b.charAt(f);
            if (!c(g) && !c(h)) return d;
            if (!c(g)) return -1;
            if (!c(h)) return 1;
            g < h ? d === 0 && (d = -1) : g > h && d === 0 && (d = 1)
        }
    }
    var e = {
        compare: function(a, e) {
            var f = 0,
                g = 0,
                h, i, j, k, l;
            if (a === e) return 0;
            typeof a == "number" && (a = a.toString()), typeof e == "number" && (e = e.toString());
            for (;;) {
                h = i = 0, j = a.charAt(f), k = e.charAt(g);
                while (b(j) || j == "0") j == "0" ? h++ : h = 0, j = a.charAt(++f);
                while (b(k) || k == "0") k == "0" ? i++ : i = 0, k = e.charAt(++g);
                if (c(j) && c(k) && (l = d(a.substring(f), e.substring(g))) != 0) return l;
                if (j === 0 && k === 0) return h - i;
                if (j < k) return -1;
                if (j > k) return 1;
                ++f, ++g
            }
        },
        wordAtPosition: function(a, b, c) {
            c = c || /[^\s]+/g;
            var d = null;
            return a.replace(c, function(a, c) {
                c <= b && c + a.length >= b && (d = a)
            }), d
        }
    };
    a(e)
})
define("app/ui/autocomplete_dropdown", ["module", "require", "exports", "core/component", "core/utils", "app/ui/with_autocomplete_helpers", "app/utils/string"], function(module, require, exports) {
    function autocompleteDropdown() {
        this.defaultAttrs({
            interestingWordRegexp: /[^\s]+/,
            typeaheadInterestingWordRegexp: /^@[^\s]+/,
            wordRegexp: /[^\s]+/g,
            autoCompleteAttr: "data-autocomplete",
            dialogIdAttr: "data-dialog-id",
            filterByDmAccess: !1,
            autocompleteUseLocalTypeahead: !1,
            autocompleteUseTypeahead: !1,
            itemImageSelector: "img",
            itemNameSelector: ".fullname",
            itemScreenNameSelector: ".username",
            itemSelector: "li.autocomplete-item",
            itemTemplateSelector: "ul.autocomplete-results > li.template-row",
            resultsSelector: "ul.autocomplete-results",
            firstSelectedItemSelector: "li.autocomplete-item.selected:first",
            selectedItemSelector: "li.autocomplete-item.selected",
            all: "*"
        }), this.hideAutocomplete = function(b, c) {
            if (b && b.type == "click" && c && c.el && $(c.el).closest(".tweet-box.rich-editor").length) return;
            this.$results.hide(), this.select("selectedItemSelector").removeClass("selected"), this.currentWord = undefined
        }, this.populateAutocompleteTypeahead = function(b, c) {
            if (!this.attr.autocompleteUseTypeahead && !this.attr.autocompleteUseLocalTypeahead) return;
            if (c.id !== this.getDropdownId() || this.currentWord !== c.query) return;
            c.suggestions || (c.suggestions = {});
            var d = this.attr.filterByDmAccess ? c.suggestions.dmAccounts : c.suggestions.accounts;
            this.$results.empty();
            if (!d || !d.length) {
                this.$results.hide();
                return
            }
            d.forEach(function(a, b) {
                var c = this.$templateNode.clone(!1);
                c.removeClass("template-row"), a.rounded_graph_weight ? a.src = "local" : a.src = "prefetched", a.verified && c.find(".js-verified").removeClass("hidden"), c.attr(this.attr.autoCompleteAttr, JSON.stringify(a));
                var d = window.location.protocol === "https:" ? a.profile_image_url_https : a.profile_image_url;
                d = d.replace(/_normal(\..*)?$/i, "_mini$1"), c.find(this.attr.itemImageSelector).attr("src", d), c.find(this.attr.itemNameSelector).html(a.name), c.find(this.attr.itemScreenNameSelector).html(a.screen_name), b == 0 && c.addClass("selected"), c.appendTo(this.$results)
            }.bind(this)), this.$results.show()
        }, this.populateAutocomplete = function(b, c) {
            this.$results.empty();
            if (!c.matches.length) {
                this.$results.hide();
                return
            }
            c.matches.forEach(function(a, b) {
                var c = this.$templateNode.clone(!1);
                c.removeClass("template-row"), a.src = "autocomplete", c.attr(this.attr.autoCompleteAttr, JSON.stringify(a)), c.find(this.attr.itemImageSelector).attr("src", a.profile_image_url), c.find(this.attr.itemNameSelector).html(a.name), c.find(this.attr.itemScreenNameSelector).html(a.screen_name), b == 0 && c.addClass("selected"), c.appendTo(this.$results)
            }.bind(this)), this.$results.show()
        }, this.notifyItemSelected = function(a, b) {
            var c = this.select("selectedItemSelector").attr(this.attr.autoCompleteAttr),
                d = JSON.parse(c);
            this.trigger("uiSendAutocompleteData", utils.merge(d, {
                itemIndex: this.select("selectedItemSelector").index(),
                dropdownId: this.getDropdownId(),
                partialWord: this.currentWord
            })), this.hideAutocomplete()
        }, this.selectItem = function(a, b) {
            var c = $(a.target).closest(this.attr.itemSelector);
            this.select("selectedItemSelector").removeClass("selected"), c.addClass("selected"), this.trigger("uiAutocompleteItemSelected")
        }, this.wordAtPosition = function(a, b) {
            return stringUtils.wordAtPosition(a, b, this.attr.wordRegexp) || ""
        }, this.updateAutocomplete = function(a, b) {
            if (b.position == Number.MAX_VALUE) return;
            var c = this.wordAtPosition(b.text, b.position);
            if (!c.match(this.attr.typeaheadInterestingWordRegexp) || b.condensed) {
                this.trigger("uiHideAutocomplete");
                return
            }
            if (this.attr.autocompleteUseTypeahead || this.attr.autocompleteUseLocalTypeahead) {
                if (!c.match(this.attr.typeaheadInterestingWordRegexp)) return;
                c[0] == "@" ? this.currentWord = c.substr(1) : this.currentWord = c, this.trigger("uiNeedsTypeaheadSuggestions", {
                    datasources: this.attr.filterByDmAccess ? ["dmAccounts"] : ["accounts"],
                    query: this.currentWord,
                    id: this.getDropdownId(),
                    localOnly: !this.attr.autocompleteUseTypeahead
                })
            } else this.trigger("uiAutocompleteNeedsUpdate", {
                word: c
            })
        }, this.resultsVisible = function() {
            return this.$results.is(":visible")
        }, this.moveSelection = function(a) {
            var b = this.select("selectedItemSelector"),
                c = this.select("itemSelector"),
                d;
            if (!b.length) {
                this.select("firstSelectedItemSelector").addClass("selected");
                return
            }
            b.removeClass("selected");
            var d = (this.$results.children().index(b[0]) + a) % c.length;
            $(c[Math.max(d, 0)]).addClass("selected")
        }, this.moveSelectionUp = function(a) {
            a.preventDefault(), this.moveSelection(-1)
        }, this.moveSelectionDown = function(a) {
            a.preventDefault(), this.moveSelection(1)
        }, this.resetAutocomplete = function(a) {
            this.hideAutocomplete(), this.$results.html(this.$templateNode)
        }, this.after("initialize", function() {
            this.$results = this.select("resultsSelector"), this.$results.attr(this.attr.dialogIdAttr, this.getDropdownId()), this.$templateNode = this.select("itemTemplateSelector").clone(!1), this.on(document, "uiBeforePageChanged", this.resetAutocomplete), this.hideAutocomplete(), utils.push(this.attr, {
                eventData: {
                    scribeContext: {
                        element: "autocomplete_dropdown"
                    }
                }
            }, !1), this.on("click", {
                itemSelector: this.selectItem,
                all: this.hideAutocomplete
            }), this.on(document, "dataTypeaheadSuggestionsResults", this.populateAutocompleteTypeahead), this.on("dataAutocompleteMatches", this.populateAutocomplete), this.on("uiAutocompleteItemSelected", this.notifyItemSelected), this.on("uiHideAutocomplete", this.hideAutocomplete), this.on(document, "uiDialogClosed", this.hideAutocomplete), this.on("uiTextChanged", this.updateAutocomplete), this.on("uiMoveSelectionDown", this.moveSelectionDown), this.on("uiMoveSelectionUp", this.moveSelectionUp), this.on("uiAutocompleteEnter", this.selectItem)
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        withAutocompleteHelpers = require("app/ui/with_autocomplete_helpers"),
        stringUtils = require("app/utils/string"),
        AutocompleteDropdown = defineComponent(autocompleteDropdown, withAutocompleteHelpers);
    module.exports = AutocompleteDropdown
});
provide("app/utils/levenshtein", function(a) {
    a(function(a, b) {
        var c, d, e = a.length,
            f = b.length;
        if (!e) return f;
        if (!f) return e;
        var g = [];
        for (var h = 0; h <= e; h++) g[h] = [], g[h][0] = h;
        for (var i = 0; i <= f; i++) g[0][i] = i;
        for (var h = 1; h <= e; h++) {
            c = a.charAt(h - 1);
            for (var i = 1; i <= f; i++) g[h][i] = Math.min(g[h - 1][i] + 1, g[h][i - 1] + 1, g[h - 1][i - 1] + (c == b.charAt(i - 1) ? 0 : 1))
        }
        return g[e][f]
    })
})
define("app/data/autocomplete", ["module", "require", "exports", "core/component", "app/utils/levenshtein", "app/data/with_data"], function(module, require, exports) {
    function autocomplete() {
        this.defaultAttrs({
            dataTTL: 864e5,
            maxResults: 10,
            userCount: 500,
            filterByDmAccess: !1,
            triggerToken: /^@/
        }), this.isContinuousMatch = function(a, b) {
            var c = new RegExp("^" + b, "i");
            return c.test(a)
        }, this.isFuzzyMatch = function(a, b) {
            var c = new RegExp("^" + b.split("").join(".*"), "i");
            return c.test(a)
        }, this.levenshteinCompare = function(a, b, c) {
            var d = levenshtein(a.screen_name, c),
                e = levenshtein(b.screen_name, c);
            return d == e ? levenshtein(a.name, c) - levenshtein(b.name, c) : d - e
        }, this.sorter = function(a, b) {
            function g(a) {
                var b = 0;
                return b += a.screen_name == f ? 16 : 0, b += c(a.name, f) ? 8 : 0, b += c(a.screen_name, f) ? 4 : 0, b += d(a.name, f) ? 2 : 0, b += d(a.screen_name, f) ? 1 : 0, a.score = b, b
            }
            var c = this.isContinuousMatch,
                d = this.isFuzzyMatch,
                e = this.levenshteinCompare,
                f = this.query;
            return g(b) - g(a) || e(a, b, f)
        }, this.getMatchesForWord = function(a) {
            var b = a.replace(this.attr.triggerToken, "").toLowerCase();
            if (this.attr.triggerToken && b == a.toLowerCase()) return [];
            b = b.replace(UNSAFE_REGEX_CHARS, "");
            if (!b) return [];
            var c = this.users.filter(function(a) {
                return this.attr.filterByDmAccess && !a.can_dm ? !1 : this.isFuzzyMatch(a.name, b) || this.isFuzzyMatch(a.screen_name, b)
            }, this);
            return c.sort(this.sorter.bind({
                isFuzzyMatch: this.isFuzzyMatch,
                isContinuousMatch: this.isContinuousMatch,
                levenshteinCompare: this.levenshteinCompare,
                query: b
            })).slice(0, this.attr.maxResults)
        }, this.withUsers = function(a) {
            if (this.users) {
                a();
                return
            }
            var b = !! this.mostRecentCallback;
            this.mostRecentCallback = a, b || this.get({
                url: "/users/autocomplete.json?count=" + this.attr.userCount,
                cache_ttl: this.attr.dataTTL,
                headers: {
                    "X-PHX": "true"
                },
                success: function(a) {
                    this.users = a.ids, this.mostRecentCallback()
                }.bind(this),
                error: function() {}
            })
        }, this.updateAutocomplete = function(a, b) {
            this.latestWord = b.word, this.withUsers(function() {
                b.word == this.latestWord && this.trigger("dataAutocompleteMatches", {
                    matches: this.getMatchesForWord(b.word),
                    word: b.word
                })
            }.bind(this))
        }, this.after("initialize", function() {
            this.on("uiAutocompleteNeedsUpdate", this.updateAutocomplete)
        })
    }
    var defineComponent = require("core/component"),
        levenshtein = require("app/utils/levenshtein"),
        withData = require("app/data/with_data"),
        Autocomplete = defineComponent(autocomplete, withData),
        UNSAFE_REGEX_CHARS = /[[\]\\*?(){}.+$^]/g;
    module.exports = Autocomplete
});
define("app/ui/typeahead/with_accounts", ["module", "require", "exports", "core/i18n"], function(module, require, exports) {
    function withAccounts() {
        this.defaultAttrs({
            accountsListSelector: ".js-typeahead-accounts",
            accountsItemSelector: ".typeahead-account-item",
            accountsShortcutSelector: ".typeahead-accounts-shortcut",
            accountsShortcutShow: !1
        }), this.renderAccounts = function(a, b) {
            this.$accountsList.find(this.attr.accountsItemSelector).remove();
            var c = b.suggestions.accounts || [];
            this.attr.datasources && this.attr.datasources.indexOf("dmAccounts") > -1 && (c = c.concat(b.suggestions.dmAccounts || []));
            if (!c.length) {
                this.clearAccounts();
                return
            }
            this.updateShortcut(b.query), c.forEach(function(a) {
                var b = this.$accountItemTemplate.clone(!1);
                a.isLocal = !! a.rounded_graph_weight, b.attr("data-user-id", a.id), b.attr("data-user-screenname", a.screen_name), b.data("item", a);
                var c = b.find("a");
                c.attr("href", "/" + a.screen_name), c.attr("data-search-query", a.id), c.find(".avatar").attr("src", this.getAvatar(a)), c.find(".fullname").text(a.name), c.find(".username b").text(a.screen_name), a.verified && c.find(".js-verified").removeClass("hidden");
                if (this.attr.deciders.showDebugInfo) {
                    var d = !! a.rounded_graph_weight;
                    c.attr("title", (d ? "local" : "remote") + " user, weight/score: " + (d ? a.rounded_graph_weight : a.rounded_score))
                }
                b.insertBefore(this.$accountsShortcut)
            }, this), this.$accountsList.addClass("has-results"), this.$accountsList.show()
        }, this.getAvatar = function(a) {
            var b = window.location.protocol === "https:" ? a.profile_image_url_https : a.profile_image_url;
            return b.replace(/_normal(\..*)?$/i, "_mini$1")
        }, this.updateShortcut = function(a) {
            this.$accountsShortcut.toggle(this.attr.accountsShortcutShow);
            var b = this.$accountsShortcut.find("a");
            b.attr("href", "/search/users?q=" + encodeURIComponent(a)), b.attr("data-search-query", a), a = $("<div/>").text(a).html(), b.html(_('Search all people for <strong>{{query}}</strong>', {
                query: a
            }))
        }, this.clearAccounts = function() {
            this.$accountsList.removeClass("has-results"), this.$accountsList.hide()
        }, this.resetAccounts = function(a) {
            this.clearAccounts(), this.$accountsList.find(this.attr.accountsItemSelector).remove(), this.$accountsList.append(this.$accountItemTemplate)
        }, this.after("initialize", function() {
            this.$accountsList = this.select("accountsListSelector"), this.$accountsShortcut = this.select("accountsShortcutSelector"), this.$accountItemTemplate = this.select("accountsItemSelector").clone(!1), this.$accountsList.hide(), this.on(document, "uiBeforePageChanged", this.resetAccounts), this.on("uiTypeaheadRenderResults", this.renderAccounts)
        })
    }
    var _ = require("core/i18n");
    module.exports = withAccounts
});
define("app/ui/typeahead/with_saved_searches", ["module", "require", "exports"], function(module, require, exports) {
    function withSavedSearches() {
        this.defaultAttrs({
            savedSearchesListSelector: ".saved-searches-list",
            savedSearchesItemSelector: ".saved-search-item"
        }), this.renderSavedSearches = function(a, b) {
            this.$savedSearchesList.empty();
            var c = b.suggestions.savedSearches || [];
            c.forEach(function(a) {
                var b = this.$savedSearchItemTemplate.clone(!1),
                    c = b.find("a");
                c.attr("href", a.saved_search_path), c.attr("data-search-query", a.query), c.attr("data-query-source", a.search_query_source), c.append($("<span>").text(a.name)), b.appendTo(this.$savedSearchesList)
            }, this)
        }, this.resetSavedSearches = function(a) {
            this.$savedSearchesList.find(this.attr.savedSearchesItemSelector).remove(), this.$savedSearchesList.append(this.$savedSearchItemTemplate)
        }, this.after("initialize", function() {
            this.$savedSearchItemTemplate = this.select("savedSearchesItemSelector").clone(!1), this.$savedSearchesList = this.select("savedSearchesListSelector"), this.on(document, "uiBeforePageChanged", this.resetSavedSearches), this.on("uiTypeaheadRenderResults", this.renderSavedSearches)
        })
    }
    module.exports = withSavedSearches
});
define("app/ui/typeahead/with_topics", ["module", "require", "exports", "core/i18n"], function(module, require, exports) {
    function withTopics() {
        this.defaultAttrs({
            topicsListSelector: ".topics-list",
            topicsItemSelector: ".topics-item"
        }), this.renderTopics = function(a, b) {
            this.$topicsList.empty();
            var c = b.suggestions.topics || [];
            if (!c.length) {
                this.clearTopics();
                return
            }
            c.forEach(function(a) {
                var b = this.$topicsItemTemplate.clone(!1),
                    c = b.find("a");
                c.attr("href", "/search?q=" + encodeURIComponent(a.topic) + "&src=tyah"), c.attr("data-search-query", a.topic), c.append($("<span>").text(a.topic)), b.appendTo(this.$topicsList)
            }, this), this.$topicsList.addClass("has-results"), this.$topicsList.show()
        }, this.clearTopics = function(a) {
            this.$topicsList.removeClass("has-results"), this.$topicsList.hide()
        }, this.resetTopics = function() {
            this.clearTopics(), this.$topicsList.find(this.attr.topicsItemSelector).remove(), this.$topicsList.append(this.$topicsItemTemplate)
        }, this.after("initialize", function() {
            this.$topicsItemTemplate = this.select("topicsItemSelector").clone(!1), this.$topicsList = this.select("topicsListSelector"), this.$topicsList.hide(), this.on(document, "uiBeforePageChanged", this.resetTopics), this.on("uiTypeaheadRenderResults", this.renderTopics)
        })
    }
    var _ = require("core/i18n");
    module.exports = withTopics
});
define("app/utils/RTLText.module", ["module", "require", "exports", "lib/twitter-text"], function(module, require, exports) {
    var TwitterText = require("lib/twitter-text"),
        RTLText = function() {
            function q(a) {
                try {
                    return document.activeElement === a
                } catch (b) {
                    return !1
                }
            }
            function r(a) {
                if (!q(a)) return 0;
                var b;
                if (typeof a.selectionStart == "number") return a.selectionStart;
                if (document.selection) {
                    a.focus(), b = document.selection.createRange(), b.moveStart("character", -a.value.length);
                    var c = b.text.length;
                    return c
                }
            }
            function s(a, b) {
                if (!q(a)) return;
                if (typeof a.selectionStart == "number") a.selectionStart = b, a.selectionEnd = b;
                else if (document.selection) {
                    var c = a.createTextRange();
                    c.collapse(!0), c.moveEnd("character", b), c.moveStart("character", b), c.select()
                }
            }
            function t(a, b, c) {
                var d = 0,
                    e = "",
                    f = b(a);
                for (var g = 0; g < f.length; g++) {
                    var h = f[g],
                        i = "";
                    h.screenName && (i = "screenName"), h.hashtag && (i = "hashtag"), h.url && (i = "url"), h.cashtag && (i = "cashtag");
                    var j = {
                        entityText: a.slice(h.indices[0], h.indices[1]),
                        entityType: i
                    };
                    e += a.slice(d, h.indices[0]) + c(j), d = h.indices[1]
                }
                return e + a.slice(d, a.length)
            }
            function u(a) {
                var b = a.match(c),
                    d = a;
                if (b || l === "rtl") d = t(d, TwitterText.extractEntitiesWithIndices, function(a) {
                    if (a.entityType === "screenName") return e + a.entityText + f;
                    if (a.entityType === "hashtag") return a.entityText.charAt(1).match(c) ? a.entityText : e + a.entityText;
                    if (a.entityType === "url") return a.entityText + e;
                    if (a.entityType === "cashtag") return e + a.entityText
                });
                return d
            }
            function v(a) {
                var b, c = a.target ? a.target : a.srcElement,
                    e = a.which ? a.which : a.keyCode;
                if (e === g.BACKSPACE) b = -1;
                else {
                    if (e !== g.DELETE) return;
                    b = 0
                }
                var f = r(c),
                    h = c.value,
                    i = 0,
                    j;
                do j = h.charAt(f + b) || "", j && (f += b, i++, h = h.slice(0, f) + h.slice(f + 1, h.length));
                while (j.match(d));
                i > 1 && (c.value = h, s(c, f), a.preventDefault ? a.preventDefault() : a.returnValue = !1)
            }
            function w(a) {
                return a.replace(d, "")
            }
            function x(a) {
                var d = a.match(c);
                a = a.replace(k, "");
                var e = 0,
                    f = a.replace(m, ""),
                    g = l;
                if (!f || !f.replace(/#/g, "")) return g === "rtl" ? !0 : !1;
                if (!d) return !1;
                if (a) {
                    var h = TwitterText.extractMentionsWithIndices(a),
                        i = h.length,
                        j;
                    for (j = 0; j < i; j++) e += h[j].screenName.length + 1;
                    var n = TwitterText.extractUrlsWithIndices(a),
                        o = n.length;
                    for (j = 0; j < o; j++) e += n[j].url.length + 2
                }
                var p = f.length - e;
                return p > 0 && d.length / p > b
            }
            function y(a) {
                var b = a.target || a.srcElement;
                a.type !== "keydown" || a.keyCode !== 91 && a.keyCode !== 16 && a.keyCode !== 88 && a.keyCode !== 17 ? a.type === "keyup" && (a.keyCode === 91 || a.keyCode === 16 || a.keyCode === 88 || a.keyCode === 17) && (o[String(a.keyCode)] = !1) : o[String(a.keyCode)] = !0, (!p && o[91] || p && o[17]) && o[16] && o[88] && (n = !0, b.dir === "rtl" ? z("ltr", b) : z("rtl", b), o = {
                    91: !1,
                    16: !1,
                    88: !1,
                    17: !1
                })
            }
            function z(a, b) {
                b.setAttribute("dir", a), b.style.direction = a, b.style.textAlign = a === "rtl" ? "right" : "left"
            }
            "use strict";
            var a = {}, b = .3,
                c = /[\u0590-\u083F]|[\u08A0-\u08FF]|[\uFB1D-\uFDFF]|[\uFE70-\uFEFF]/gm,
                d = /\u200e|\u200f/gm,
                e = "â€Ž",
                f = "â€",
                g = {
                    BACKSPACE: 8,
                    DELETE: 46
                }, h = 0,
                i = 20,
                j = !1,
                k = "",
                l = "",
                m = /^\s+|\s+$/g,
                n = !1,
                o = {
                    91: !1,
                    16: !1,
                    88: !1,
                    17: !1
                }, p = navigator.userAgent.indexOf("Mac") === -1;
            return a.onTextChange = function(b) {
                var c = b || window.event;
                y(b), c.type === "keydown" && v(c), a.setText(c.target || c.srcElement)
            }, a.setText = function(a) {
                l || (a.style.direction ? l = a.style.direction : a.dir ? l = a.dir : document.body.style.direction ? l = document.body.style.direction : l = document.body.dir), arguments.length === 2 && (l = a.ownerDocument.documentElement.className, k = arguments[1]);
                var b = a.value;
                if (!b) return;
                var c = w(b);
                j = x(c);
                var d = u(c),
                    e = j ? "rtl" : "ltr";
                d !== b && (a.value = d, s(a, r(a) + d.length - c.length)), n || z(e, a)
            }, a.textLength = function(a) {
                var b = w(a),
                    c = TwitterText.extractUrls(b),
                    d = b.length - c.join("").length,
                    e = c.length;
                for (var f = 0; f < e; f++) d += i, /^https:/.test(c[f]) && (d += 1);
                return h = d
            }, a.cleanText = function(a) {
                return w(a)
            }, a.addRTLMarkers = function(a) {
                return u(a)
            }, a.shouldBeRTL = function(a) {
                return x(a)
            }, a
        }();
    typeof module != "undefined" && module.exports && (module.exports = RTLText)
});
define("app/ui/typeahead/typeahead_dropdown", ["module", "require", "exports", "core/component", "app/ui/typeahead/with_accounts", "app/ui/typeahead/with_saved_searches", "app/ui/typeahead/with_topics", "app/utils/RTLText.module"], function(module, require, exports) {
    function typeaheadDropdown() {
        this.defaultAttrs({
            inputSelector: "#search-query",
            dropdownSelector: ".dropdown-menu.typeahead",
            itemsSelector: ".typeahead-items li",
            blockLinkActions: !1,
            deciders: {
                showDebugInfo: !1
            },
            datasources: []
        }), this.dropdownFocus = function() {
            this.$input.attr("data-focus", !0)
        }, this.dropdownBlur = function() {
            this.$input.attr("data-focus", !1), this.hide()
        }, this.mouseOver = function(a, b) {
            this.select("itemsSelector").removeClass("selected"), $(b.el).addClass("selected")
        }, this.moveSelection = function(a) {
            var b = this.select("itemsSelector").filter(":visible"),
                c = b.filter(".selected");
            c.removeClass("selected");
            var d = b.index(c) + a;
            d = (d + 1) % (b.length + 1) - 1;
            if (d === -1) {
                this.trigger(this.$input, "uiTypeaheadInputFocus");
                return
            }
            d < -1 && (d = b.length - 1), b.eq(d).addClass("selected")
        }, this.moveSelectionUp = function(a) {
            this.moveSelection(-1)
        }, this.moveSelectionDown = function(a) {
            this.moveSelection(1)
        }, this.dropdownIsOpen = function() {
            return this.$dropdown.is(":visible")
        }, this.show = function() {
            this.$dropdown.show(), this.trigger("uiTypeaheadResultsShown")
        }, this.hide = function(a) {
            if (this.mouseIsOverDropdown) return;
            if (!this.dropdownIsOpen()) return;
            a && (a.preventDefault(), a.stopPropagation()), this.$dropdown.hide(), this.trigger("uiTypeaheadResultsHidden")
        }, this.forceHide = function() {
            this.mouseIsOverDropdown = !1, this.hide()
        }, this.inputValueUpdated = function(a, b) {
            this.lastQuery = b.value, this.trigger("uiNeedsTypeaheadSuggestions", {
                datasources: this.attr.datasources,
                query: b.value,
                id: this.getDropdownId()
            })
        }, this.getDropdownId = function() {
            return this.dropdownId || (this.dropdownId = "swift_typeahead_dropdown_" + Math.floor(Math.random() * 1e6)), this.dropdownId
        }, this.triggerSelectionEvent = function(a, b) {
            this.attr.blockLinkActions && a.preventDefault();
            var c = this.select("itemsSelector"),
                d = c.filter(".selected").first(),
                e = d.find("a"),
                f = d.index(),
                g = this.lastQuery,
                h = e.attr("data-search-query");
            d.removeClass("selected");
            if (!g && !h) return;
            var i = this.getItemData(d);
            this.trigger("uiTypeaheadItemSelected", {
                index: f,
                source: e.data("ds"),
                query: h,
                input: g,
                display: d.data("user-screenname") || h,
                href: e.attr("href"),
                isClick: a.originalEvent ? a.originalEvent.type === "click" : !1,
                isLocal: i && i.isLocal,
                item: i
            }), this.forceHide()
        }, this.getItemData = function(a) {
            return a.data("item")
        }, this.submitQuery = function(a, b) {
            var c = this.select("itemsSelector").filter(".selected").first();
            if (c.length) {
                this.triggerSelectionEvent(a, b);
                return
            }
            var d = this.$input.val();
            if (d.trim() === "") return;
            this.trigger("uiTypeaheadSubmitQuery", {
                query: RTLText.cleanText(d)
            }), this.forceHide()
        }, this.completeSelection = function(a) {
            var b = this.select("itemsSelector").filter(".selected").first(),
                c = b.find("a");
            if (!b.length && this.dropdownIsOpen()) {
                var c = this.select("itemsSelector").first().find("a");
                b = this.select("itemsSelector").first()
            }
            if (!b.length) return;
            var d = c.data("search-query"),
                e = this.select("itemsSelector"),
                f = e.index(b),
                g = this.lastQuery;
            this.trigger("uiTypeaheadItemPossiblyComplete", {
                triggeringEventType: a.type,
                value: d,
                source: c.data("ds"),
                index: f,
                query: d,
                item: b.data("item"),
                display: b.data("user-screenname") || d,
                input: g,
                href: c.attr("href") || ""
            })
        }, this.updateDropdown = function(a, b) {
            if (b.id !== this.getDropdownId() || b.query !== this.lastQuery || !this.$input.attr("data-focus")) return;
            this.trigger("uiTypeaheadRenderResults", b);
            var c = this.attr.datasources.some(function(a) {
                return b.suggestions[a] && b.suggestions[a].length
            });
            c && this.$input.is(document.activeElement) ? (this.show(), this.trigger("uiTypeaheadSetPreventDefault", {
                preventDefault: !0,
                key: 9
            }), this.trigger("uiTypeaheadResultsShown")) : (this.forceHide(), this.trigger("uiTypeaheadSetPreventDefault", {
                preventDefault: !1,
                key: 9
            }), this.trigger("uiTypeaheadResultsHidden"))
        }, this.mouseEnter = function(a, b) {
            this.mouseIsOverDropdown = !0
        }, this.mouseLeave = function(a, b) {
            this.mouseIsOverDropdown = !1
        }, this.after("initialize", function() {
            this.$input = this.select("inputSelector"), this.$dropdown = this.select("dropdownSelector"), this.on(this.$input, "uiTypeaheadInputFocus", this.dropdownFocus), this.on(this.$input, "uiTypeaheadInputBlur", this.dropdownBlur), this.on(this.$input, "uiTypeaheadInputSubmit", this.submitQuery), this.on(this.$input, "uiTypeaheadInputChanged", this.inputValueUpdated), this.on(this.$input, "uiTypeaheadInputMoveUp", this.moveSelectionUp), this.on(this.$input, "uiTypeaheadInputMoveDown", this.moveSelectionDown), this.on(this.$input, "uiTypeaheadInputTab uiTypeaheadInputRight uiTypeaheadInputLeft", this.completeSelection), this.on(this.$input, "uiShortcutEsc", this.hide), this.on(this.$dropdown, "mouseenter", this.mouseEnter), this.on(this.$dropdown, "mouseleave", this.mouseLeave), this.on(document, "dataTypeaheadSuggestionsResults", this.updateDropdown), this.on(document, "uiBeforePageChanged", this.forceHide), this.on("mouseover", {
                itemsSelector: this.mouseOver
            }), this.on("click", {
                itemsSelector: this.triggerSelectionEvent
            })
        })
    }
    var defineComponent = require("core/component"),
        withAccounts = require("app/ui/typeahead/with_accounts"),
        withSavedSearches = require("app/ui/typeahead/with_saved_searches"),
        withTopics = require("app/ui/typeahead/with_topics"),
        RTLText = require("app/utils/RTLText.module");
    module.exports = defineComponent(typeaheadDropdown, withSavedSearches, withAccounts, withTopics)
});
define("app/ui/typeahead/typeahead_input", ["module", "require", "exports", "core/component", "app/utils/caret", "app/utils/string", "app/utils/RTLText.module"], function(module, require, exports) {
    function typeaheadInput() {
        this.defaultAttrs({
            inputSelector: "#search-query",
            buttonSelector: ".nav-search",
            wordsRegExp: /\S+\s?/g,
            interestingWordRegexp: /@?(.*)/,
            autocompleteAccounts: !0
        }), this.getDefaultKeycodes = function() {
            var a = {
                13: {
                    name: "ENTER",
                    event: "uiTypeaheadInputSubmit",
                    on: "keypress",
                    preventDefault: !0,
                    enabled: !0
                },
                9: {
                    name: "TAB",
                    event: "uiTypeaheadInputTab",
                    on: "keydown",
                    preventDefault: !0,
                    enabled: !0
                },
                37: {
                    name: "LEFT",
                    event: "uiTypeaheadInputLeft",
                    on: "keydown",
                    enabled: !0
                },
                39: {
                    name: "RIGHT",
                    event: "uiTypeaheadInputRight",
                    on: "keydown",
                    enabled: !0
                },
                38: {
                    name: "UP",
                    event: "uiTypeaheadInputMoveUp",
                    on: "keydown",
                    preventDefault: !0,
                    enabled: !0
                },
                40: {
                    name: "DOWN",
                    event: "uiTypeaheadInputMoveDown",
                    on: "keydown",
                    preventDefault: !0,
                    enabled: !0
                }
            };
            return a
        }, this.setPreventKeyDefault = function(a, b) {
            this.KEY_CODE_MAP[b.key].preventDefault = b.preventDefault
        }, this.toggleTextareaActions = function(a) {
            this.KEY_CODE_MAP[13].enabled = a, this.KEY_CODE_MAP[38].enabled = a, this.KEY_CODE_MAP[40].enabled = a
        }, this.enableTextareaActionWatching = function() {
            this.toggleTextareaActions(!0)
        }, this.disableTextareaActionWatching = function() {
            this.toggleTextareaActions(!1)
        }, this.focus = function(a) {
            this.trigger(this.$input, "uiTypeaheadInputFocus"), this.updateCaretPosition()
        }, this.click = function(a) {
            this.updateCaretPosition()
        }, this.blur = function(a) {
            this.currentQuery = null, this.trigger(this.$input, "uiTypeaheadInputBlur")
        }, this.updateCaretPosition = function() {
            this.richTextareaMode || this.trigger(this.$input, "uiTextChanged", {
                text: this.$input.val(),
                position: caret.getPosition(this.$input[0])
            })
        }, this.modifierKeyPressed = function(a) {
            var b = this.KEY_CODE_MAP[a.which || a.keyCode],
                c = a.type == "keydown" && a.which == 16 || a.type == "keyup" && a.which == 16;
            if (b && b.enabled) {
                if (a.type !== b.on) return;
                if (b.name == "TAB" && a.shiftKey) return;
                if (this.releaseTabKey && b.name == "TAB") return;
                b.preventDefault && a.preventDefault(), this.trigger(this.$input, b.event), this.updateCaretPosition()
            } else {
                if (a.keyCode == 27) return;
                c || (this.releaseTabKey = !1), this.richTextareaMode || ((a.type === "keydown" || a.type === "keyup") && RTLText.onTextChange(a), this.trigger(this.$input, "uiTextChanged", {
                    text: this.$input.val(),
                    position: caret.getPosition(this.$input[0])
                }))
            }
        }, this.getCurrentWord = function() {
            var a;
            this.textareaMode ? a = stringUtils.wordAtPosition(this.text, this.position, this.attr.wordRegexp) || "" : a = this.text;
            var b = a.match(this.attr.interestingWordRegexp);
            return b ? (a = b[1] || a, this.textareaMode || (a = a.trim() == "" ? "" : a), a) : null
        }, this.completeInput = function(a, b) {
            if (!this.isValidCompletionAction(b.triggeringEventType)) return;
            this.textareaMode || (this.releaseTabKey = !0);
            var c = b.value || b.query,
                d = c !== this.currentQuery && (b.source != "account" || a.type == "uiTypeaheadItemSelected" || this.attr.autocompleteAccounts && b.triggeringEventType == "uiTypeaheadInputTab") && (b.source != "account" || b.item.screen_name !== this.currentQuery);
            if (!d) return;
            var e = c;
            b.source == "account" && (e = (this.textareaMode ? "@" : "") + b.item.screen_name, this.currentQuery = b.item.screen_name);
            if (this.textareaMode) {
                var f = this.replaceWordAtPosition(this.text, this.position, e + " ");
                this.richTextareaMode || this.$input.focus(), this.$input.trigger("uiChangeTextAndPosition", f)
            } else this.$input.val(e), a.type != "uiTypeaheadItemSelected" && (this.$input.focus(), this.setQuery(e));
            b.scribeNow = this.textareaMode && a.type != "uiTypeaheadItemSelected", this.trigger(this.$input, "uiTypeaheadItemComplete", b)
        }, this.replaceWordAtPosition = function(a, b, c) {
            var d = null,
                a = a.replace(this.attr.wordsRegExp, function(a, e) {
                    return e <= b && e + a.length >= b ? (d = e + c.length, c) : a
                });
            return {
                text: a,
                position: d
            }
        }, this.isValidCompletionAction = function(a) {
            var b = this.$input.attr("dir") === "rtl";
            return b && a === "uiTypeaheadInputRight" ? !1 : !b && a === "uiTypeaheadInputLeft" ? !1 : this.position != this.text.length && (a === "uiTypeaheadInputRight" || b && a === "uiTypeaheadInputLeft") ? !1 : !0
        }, this.setQuery = function(a) {
            var b;
            a = a ? RTLText.cleanText(a) : "";
            if (!this.currentQuery || this.currentQuery !== a) this.currentQuery = a, b = a.length > 0 ? 0 : -1, this.$button.attr("tabIndex", b), this.trigger(this.$input, "uiTypeaheadInputChanged", {
                value: this.currentQuery
            })
        }, this.setRTLMarkers = function() {
            RTLText.setText(this.$input.get(0))
        }, this.clearInput = function() {
            this.$input.val("").blur(), this.$button.attr("tabIndex", -1), this.releaseTabKey = !1
        }, this.saveTextAndPosition = function(a, b) {
            if (b.position == Number.MAX_VALUE) return;
            this.text = b.text, this.position = b.position;
            var c = this.getCurrentWord();
            this.setQuery(c)
        }, this.after("initialize", function() {
            this.$input = this.select("inputSelector"), this.textareaMode = !this.$input.is("input"), this.richTextareaMode = this.$input.is(".rich-editor"), this.$button = this.select("buttonSelector"), this.KEY_CODE_MAP = this.getDefaultKeycodes(), this.richTextareaMode && this.disableTextareaActionWatching(), this.$button.attr("tabIndex", -1), this.on(this.$input, "keyup keydown keypress paste", this.modifierKeyPressed), this.on(this.$input, "focus", this.focus), this.on(this.$input, "blur", this.blur), this.textareaMode && (this.on(this.$input, "click", this.click), this.on("uiTypeaheadResultsShown", this.enableTextareaActionWatching), this.on("uiTypeaheadResultsHidden", this.disableTextareaActionWatching)), this.on("uiTextChanged", this.saveTextAndPosition), this.on(document, "uiBeforePageChanged", this.clearInput), this.on("uiTypeaheadSetPreventDefault", this.setPreventKeyDefault), this.on(document, "uiSwiftLoaded uiPageChanged", this.setRTLMarkers), this.on("uiTypeaheadItemPossiblyComplete uiTypeaheadItemSelected", this.completeInput)
        })
    }
    var defineComponent = require("core/component"),
        caret = require("app/utils/caret"),
        stringUtils = require("app/utils/string"),
        RTLText = require("app/utils/RTLText.module");
    module.exports = defineComponent(typeaheadInput)
});
define("app/ui/with_click_outside", ["module", "require", "exports"], function(module, require, exports) {
    function withClickOutside() {
        this.onClickOutside = function(a, b) {
            b = b.bind(this), this.clickOutsideHandler = function(c, d) {
                var e = !0;
                a.each(function() {
                    if ($(c.target).closest(this).length) return e = !1, !1
                }), e && b(c, d)
            }, $(document).on("click", this.clickOutsideHandler)
        }, this.offClickOutside = function() {
            this.clickOutsideHandler && ($(document).off("click", this.clickOutsideHandler), this.clickOutsideHandler = null)
        }, this.before("teardown", function() {
            this.offClickOutside()
        })
    }
    module.exports = withClickOutside
});
define("app/ui/geo_picker", ["module", "require", "exports", "core/component", "core/i18n", "app/ui/with_click_outside", "core/utils"], function(module, require, exports) {
    function geoPicker() {
        this.defaultAttrs({
            buttonSelector: "button.geo-picker-btn",
            placeIdSelector: "input[name=place_id]",
            statusSelector: "span.geo-status",
            dropdownContainerSelector: "span.dropdown-container",
            dropdownSelector: "ul.dropdown-menu",
            dropdownDisabledSelector: "#geo-disabled-dropdown",
            enableButtonSelector: "button.geo-turn-on",
            notNowButtonSelector: "button.geo-not-now",
            dropdownEnabledSelector: "#geo-enabled-dropdown",
            querySelector: "li.geo-query-location input",
            geoSearchSelector: "li.geo-query-location i",
            dropdownStatusSelector: "li.geo-dropdown-status",
            searchResultsSelector: "li.geo-search-result",
            placeResultsSelector: "li.geo-place-result",
            changePlaceSelector: "li[data-place-id]",
            turnOffButtonSelector: "li.geo-turn-off-item",
            focusableSelector: "li.geo-focusable",
            firstFocusableSelector: "li.geo-focusable:first",
            focusedSelector: "li.geo-focused"
        }), this.selectGeoAction = function(a) {
            if (this.dropdownIsOpen()) {
                this.hideDropdownAndRestoreFocus();
                return
            }
            switch (this.geoState.state) {
                case "disabled":
                case "enableIsUnavailable":
                    this.trigger("uiGeoPickerOffer");
                    break;
                case "locateIsUnavailable":
                case "enabledTurnedOn":
                    this.requestGeoState();
                    break;
                case "enabledTurnedOff":
                    this.turnOn();
                    break;
                case "changing":
                case "locating":
                case "located":
                case "locationUnknown":
                case "locateIsUnavailable":
                    this.trigger("uiGeoPickerOpen")
            }
        }, this.dropdownIsOpen = function() {
            return this.select("dropdownSelector").is(":visible")
        }, this.hideDropdown = function() {
            this.offClickOutside(), this.select("dropdownSelector").hide(), this.select("buttonSelector").removeClass("open")
        }, this.captureActiveEl = function() {
            this.activeEl = document.activeElement
        }, this.hideDropdownAndRestoreFocus = function() {
            this.hideDropdown(), this.activeEl && (this.activeEl.focus(), this.activeEl = null)
        }, this.openDropdown = function(a, b) {
            var c, d;
            a.type == "uiGeoPickerOpen" ? (c = this.attr.dropdownEnabledSelector, d = 1) : (c = this.attr.dropdownDisabledSelector, d = 0), this.captureActiveEl(), d != this.dropdownState && (this.select("dropdownContainerSelector").html($(c).html()), this.dropdownState = d);
            var e = this.select("dropdownSelector");
            this.showGeoState(), this.onClickOutside(e.add(this.select("buttonSelector")), this.hideDropdown), this.lastQuery = "", this.geoQueryFieldChanged = !1, e.show();
            var f = this.select("enableButtonSelector");
            f.length || (f = this.select("querySelector")), this.select("buttonSelector").addClass("open"), f.focus()
        }, this.enable = function() {
            this.hideDropdownAndRestoreFocus(), this.trigger("uiGeoPickerEnable")
        }, this.setFocus = function(a) {
            var b = $(a.target);
            this.select("focusedSelector").not(b).removeClass("geo-focused"), b.addClass("geo-focused")
        }, this.clearFocus = function(a) {
            $(a.target).removeClass("geo-focused")
        }, this.turnOn = function() {
            this.trigger("uiGeoPickerTurnOn")
        }, this.turnOff = function() {
            this.hideDropdownAndRestoreFocus(), this.trigger("uiGeoPickerTurnOff")
        }, this.changePlace = function(a) {
            var b = $(a.target),
                c = b.attr("data-place-id");
            this.hideDropdownAndRestoreFocus();
            if (!c || c === this.lastPlaceId) return;
            var d = {
                placeId: c,
                scribeData: {
                    item_names: [c]
                }
            };
            this.lastPlaceId && d.scribeData.item_names.push(this.lastPlaceId), b.hasClass("geo-search-result") && this.lastQueryData && (d.scribeData.query = this.lastQueryData.query), this.trigger("uiGeoPickerChange", d)
        }, this.updateState = function(a, b) {
            this.geoState = b, this.showGeoState()
        }, this.showGeoState = function() {
            var a = "",
                b = "",
                c = !1,
                d = "",
                e = this.geoState;
            switch (e.state) {
                case "enabling":
                case "locating":
                    a = _('Getting location...');
                    break;
                case "enableIsUnavailable":
                case "locateIsUnavailable":
                    a = _('Location service unavailable');
                    break;
                case "changing":
                    a = _('Changing location...');
                    break;
                case "locationUnknown":
                    a = _('Unknown location');
                    break;
                case "located":
                    a = e.place_name, b = e.place_id, d = e.places_html, c = !0
            }
            this.$node.toggleClass("active", c), this.select("statusSelector").text(a), this.select("buttonSelector").attr("title", a || _('Add location')), this.select("placeResultsSelector").add(this.select("searchResultsSelector")).remove(), this.select("dropdownStatusSelector").text(a).toggle(!c).after(d), this.select("placeIdSelector").val(b), this.lastPlaceId = b
        }, this.requestGeoState = function() {
            this.trigger("uiRequestGeoState")
        }, this.queryKeyDown = function(a) {
            switch (a.which) {
                case 38:
                    a.preventDefault(), this.moveFocus(-1);
                    break;
                case 40:
                    a.preventDefault(), this.moveFocus(1);
                    break;
                case 13:
                    a.preventDefault();
                    var b = this.select("focusedSelector");
                    if (b.length) {
                        a.stopPropagation(), b.trigger("uiGeoPickerSelect");
                        return
                    }
                    this.searchExactMatch()
            }
            this.searchAutocomplete()
        }, this.onEsc = function(a) {
            if (!this.dropdownIsOpen()) return;
            a.preventDefault(), a.stopPropagation(), this.hideDropdownAndRestoreFocus()
        }, this.searchIfQueryChanged = function(a) {
            var b = this.select("querySelector").val() || "";
            if (a && this.lastQuery === b) return;
            this.lastIsPrefix = a, this.lastQuery = b, this.select("dropdownStatusSelector").text(_('Searching places...')).show(), this.geoQueryFieldChanged || (this.geoQueryFieldChanged = !0, this.trigger("uiGeoPickerInteraction")), this.trigger("uiGeoPickerSearch", {
                placeId: this.lastPlaceId,
                query: b,
                isPrefix: a
            })
        }, this.searchExactMatch = function() {
            this.searchIfQueryChanged(!1)
        }, this.searchAutocomplete = function() {
            setTimeout(function() {
                this.searchIfQueryChanged(!0)
            }.bind(this), 0)
        }, this.moveFocus = function(a) {
            var b = this.select("focusedSelector"),
                c = this.select("focusableSelector"),
                d = c.index(b) + a,
                e = c.length - 1;
            d < 0 ? d = e : d > e && (d = 0), b.removeClass("geo-focused"), c.eq(d).addClass("geo-focused")
        }, this.searchResults = function(a, b) {
            var c = b.sourceEventData;
            if (!c || c.placeId !== this.lastPlaceId || c.query !== this.select("querySelector").val() || c.isPrefix && !this.lastIsPrefix) return;
            this.lastQueryData = c, this.select("searchResultsSelector").remove(), this.select("dropdownStatusSelector").hide().after(b.html)
        }, this.searchUnavailable = function(a, b) {
            this.select("dropdownStatusSelector").text(_('Location service unavailable')).show()
        }, this.preventFocusLoss = function(a) {
            var b;
            $.browser.msie && parseInt($.browser.version, 10) < 9 ? (b = $(document.activeElement), b.is(this.select("buttonSelector")) ? this.captureActiveEl() : b.one("beforedeactivate", function(a) {
                a.preventDefault()
            })) : a.preventDefault()
        }, this.after("initialize", function() {
            utils.push(this.attr, {
                eventData: {
                    scribeContext: {
                        element: "geo_picker"
                    }
                }
            }, !1), this.geoState = {}, this.on(this.attr.parent, "uiPrepareTweetBox", this.requestGeoState), this.on(document, "dataGeoState", this.updateState), this.on(document, "dataGeoSearchResults", this.searchResults), this.on(document, "dataGeoSearchResultsUnavailable", this.searchUnavailable), this.on("mousedown", {
                buttonSelector: this.preventFocusLoss
            }), this.on("click", {
                buttonSelector: this.selectGeoAction,
                enableButtonSelector: this.enable,
                notNowButtonSelector: this.hideDropdownAndRestoreFocus,
                turnOffButtonSelector: this.turnOff,
                geoSearchSelector: this.searchExactMatch,
                changePlaceSelector: this.changePlace
            }), this.on("uiGeoPickerSelect", {
                turnOffButtonSelector: this.turnOff,
                changePlaceSelector: this.changePlace
            }), this.on("mouseover", {
                focusableSelector: this.setFocus
            }), this.on("mouseout", {
                focusableSelector: this.clearFocus
            }), this.on("keydown", {
                querySelector: this.queryKeyDown
            }), this.on("uiShortcutEsc", this.onEsc), this.on("change paste", {
                querySelector: this.searchAutocomplete
            }), this.on("uiGeoPickerOpen uiGeoPickerOffer", this.openDropdown)
        }), this.before("teardown", function() {
            this.hideDropdown()
        })
    }
    var defineComponent = require("core/component"),
        _ = require("core/i18n"),
        withClickOutside = require("app/ui/with_click_outside"),
        utils = require("core/utils");
    module.exports = defineComponent(geoPicker, withClickOutside)
});
define("app/ui/tweet_box_manager", ["module", "require", "exports", "core/utils", "app/ui/tweet_box", "app/ui/tweet_box_thumbnails", "app/ui/image_selector", "app/ui/autocomplete_dropdown", "app/data/autocomplete", "app/ui/typeahead/typeahead_dropdown", "app/ui/typeahead/typeahead_input", "app/ui/geo_picker", "core/utils", "core/component"], function(module, require, exports) {
    function tweetBoxManager() {
        this.createTweetBoxAtTarget = function(a, b) {
            this.createTweetBox(a.target, b)
        }, this.createTweetBox = function(a, b) {
            var c = $(a);
            if (!((b.eventData || {}).scribeContext || {}).component) throw new Error("Please specify scribing component for tweet box.");
            c.find(".geo-picker").length > 0 && GeoPicker.attachTo(c.find(".geo-picker"), utils.merge(b, {
                parent: c
            }, !0)), TweetBox.attachTo(c, utils.merge({
                eventParams: {
                    type: "Tweet"
                }
            }, b)), c.find(".photo-selector").length > 0 && (TweetBoxThumbnails.attachTo(c.find(".thumbnail-container"), utils.merge(b, !0)), ImageSelector.attachTo(c.find(".photo-selector"), utils.merge(b, !0))), this.attr.useTypeaheadEverywhere ? (TypeaheadInput.attachTo(c, utils.merge(b, {
                inputSelector: "div.rich-editor, textarea.tweet-box",
                wordsRegExp: /@\S+/g,
                interestingWordRegexp: /@(\S+)/
            })), TypeaheadDropdown.attachTo(c, utils.merge(b, {
                inputSelector: "div.rich-editor, textarea.tweet-box",
                blockLinkActions: !0,
                datasources: ["accounts"],
                deciders: this.attr.typeaheadData
            }))) : (AutocompleteDropdown.attachTo(c, utils.merge(b, {
                autocompleteUseLocalTypeahead: this.attr.autocompleteUseLocalTypeahead,
                autocompleteUseTypeahead: this.attr.autocompleteUseTypeahead,
                manageTextChanges: !1,
                autocompleteInputSelector: "div.rich-editor, textarea.tweet-box"
            })), Autocomplete.attachTo(c))
        }, this.after("initialize", function() {
            this.on("uiInitTweetbox", this.createTweetBoxAtTarget), this.attr.initializeOnLoad && this.createTweetBox.apply(this, this.attr.initializeOnLoad)
        })
    }
    var utils = require("core/utils"),
        TweetBox = require("app/ui/tweet_box"),
        TweetBoxThumbnails = require("app/ui/tweet_box_thumbnails"),
        ImageSelector = require("app/ui/image_selector"),
        AutocompleteDropdown = require("app/ui/autocomplete_dropdown"),
        Autocomplete = require("app/data/autocomplete"),
        TypeaheadDropdown = require("app/ui/typeahead/typeahead_dropdown"),
        TypeaheadInput = require("app/ui/typeahead/typeahead_input"),
        GeoPicker = require("app/ui/geo_picker"),
        utils = require("core/utils"),
        defineComponent = require("core/component"),
        TweetBoxManager = defineComponent(tweetBoxManager);
    module.exports = TweetBoxManager
});
define("app/boot/tweet_boxes", ["module", "require", "exports", "app/data/geo", "app/data/tweet", "app/ui/tweet_dialog", "app/ui/new_tweet_button", "core/utils", "app/data/tweet_box_scribe", "app/ui/tweet_box_manager"], function(module, require, exports) {
    function initialize(a) {
        GeoData.attachTo(document, a), TweetData.attachTo(document, a), TweetDialog.attachTo("#global-tweet-dialog"), NewTweetButton.attachTo("#global-new-tweet-button", {
            eventData: {
                scribeContext: {
                    component: "top_bar",
                    element: "tweet_button"
                }
            }
        }), TweetBoxScribe.attachTo(document, a), TweetBoxManager.attachTo(document, utils.merge(a, {
            initializeOnLoad: ["#global-tweet-dialog form.tweet-form", {
                eventData: {
                    scribeContext: {
                        component: "tweet_box_dialog"
                    }
                },
                modal: !0
            }]
        }))
    }
    var GeoData = require("app/data/geo"),
        TweetData = require("app/data/tweet"),
        TweetDialog = require("app/ui/tweet_dialog"),
        NewTweetButton = require("app/ui/new_tweet_button"),
        utils = require("core/utils"),
        TweetBoxScribe = require("app/data/tweet_box_scribe"),
        TweetBoxManager = require("app/ui/tweet_box_manager");
    module.exports = initialize
});
define("app/ui/user_dropdown", ["module", "require", "exports", "core/component", "app/ui/with_dropdown", "app/utils/storage/core"], function(module, require, exports) {
    function userDropdown() {
        this.defaultAttrs({
            feedbackLinkSelector: ".feedback-callout-link"
        }), this.signout = function() {
            storage.clearAll(), this.$signoutForm.submit()
        }, this.showDirectMessageDialog = function(a, b) {
            this.trigger("uiNeedsDMDialog"), this.toggleDisplay(), a.preventDefault()
        }, this.showKeyboardShortcutsDialog = function(a, b) {
            this.trigger(document, "uiOpenKeyboardShortcutsDialog"), a.preventDefault()
        }, this.showConversationNotification = function(a, b) {
            this.unreadThreads = b.threads, this.$node.addClass(this.attr.glowClass), this.$dmCount.addClass(this.attr.glowClass).text(b.threads.length)
        }, this.openFeedbackDialog = function(a, b) {
            this.closeDropdown(), this.trigger("uiPrepareFeedbackDialog", {})
        }, this.updateConversationNotication = function(a, b) {
            var c = $.inArray(b.recipient, this.unreadThreads);
            if (c === -1) return;
            this.unreadThreads.splice(c, 1);
            var d = parseInt(this.$dmCount.text(), 10) - 1;
            d ? this.$dmCount.text(d) : (this.$node.removeClass(this.attr.glowClass), this.$dmCount.removeClass(this.attr.glowClass).text(""))
        }, this.after("initialize", function() {
            this.unreadThreads = [], this.$signoutForm = this.select("signoutForm"), this.on(this.attr.keyboardShortcuts, "click", this.showKeyboardShortcutsDialog), this.on(this.attr.feedbackLinkSelector, "click", this.openFeedbackDialog), this.$dmCount = this.select("dmCount"), this.on(this.attr.signout, "click", this.signout), this.on(this.attr.directMessages, "click", this.showDirectMessageDialog), this.on(document, "uiDMDialogOpenedConversation", this.updateConversationNotication), this.on(document, "uiDMDialogHasNewConversations", this.showConversationNotification), this.on(document, "click", this.close), this.on(document, "uiNavigate", this.close)
        })
    }
    var defineComponent = require("core/component"),
        withDropdown = require("app/ui/with_dropdown"),
        storage = require("app/utils/storage/core"),
        UserDropdown = defineComponent(userDropdown, withDropdown);
    module.exports = UserDropdown
});
define("app/ui/signin_dropdown", ["module", "require", "exports", "core/component", "app/ui/with_dropdown"], function(module, require, exports) {
    function signinDropdown() {
        this.defaultAttrs({
            toggler: ".js-session .dropdown-toggle",
            usernameSelector: ".email-input"
        }), this.focusUsername = function() {
            this.select("usernameSelector").focus()
        }, this.after("initialize", function() {
            this.on("uiDropdownOpened", this.focusUsername)
        })
    }
    var defineComponent = require("core/component"),
        withDropdown = require("app/ui/with_dropdown"),
        SigninDropdown = defineComponent(signinDropdown, withDropdown);
    module.exports = SigninDropdown
});
define("app/ui/search_input", ["module", "require", "exports", "core/component", "app/utils/RTLText.module"], function(module, require, exports) {
    function searchInput() {
        this.defaultAttrs({
            magnifyingGlassSelector: ".js-search-action",
            inputFieldSelector: "#search-query",
            hintFieldSelector: "#search-query-hint",
            query: "",
            searchPathWithQuery: "/search?q=query&src=typd"
        }), this.focus = function(a) {
            this.$node.addClass("focus"), this.$input.addClass("focus"), this.$hint.addClass("focus")
        }, this.blur = function(a) {
            this.$node.removeClass("focus"), this.$input.removeClass("focus"), this.$hint.removeClass("focus")
        }, this.executeTypeaheadSelection = function(a, b) {
            this.$input.val(b.display);
            if (b.isClick) return;
            this.trigger("uiNavigate", {
                href: b.href
            })
        }, this.submitQuery = function(a, b) {
            this.trigger("uiSearchQuery", {
                query: b.query,
                source: "search"
            }), this.trigger("uiNavigate", {
                href: this.attr.searchPathWithQuery.replace("query", encodeURIComponent(b.query))
            })
        }, this.searchFormSubmit = function(a, b) {
            a.preventDefault(), this.trigger(this.$input, "uiTypeaheadInputSubmit")
        }, this.after("initialize", function() {
            this.$input = this.select("inputFieldSelector"), this.$hint = this.select("hintFieldSelector"), this.$input.val(this.attr.query), this.on("uiTypeaheadItemSelected", this.executeTypeaheadSelection), this.on("uiTypeaheadSubmitQuery", this.submitQuery), this.on(this.$input, "uiTypeaheadInputFocus", this.focus), this.on(this.$input, "uiTypeaheadInputBlur", this.blur), this.on("submit", this.searchFormSubmit), this.on(this.select("magnifyingGlassSelector"), "click", this.searchFormSubmit)
        })
    }
    var defineComponent = require("core/component"),
        RTLText = require("app/utils/RTLText.module");
    module.exports = defineComponent(searchInput)
});
define("app/utils/animate_window_scrolltop", ["module", "require", "exports"], function(module, require, exports) {
    function getScrollEl() {
        return scrollEl ? scrollEl : ([document.body, document.documentElement].forEach(function(a) {
            var b = a.scrollTop;
            a.scrollTop = b + 1, a.scrollTop == b + 1 && (scrollEl = a.tagName.toLowerCase(), a.scrollTop = b)
        }), scrollEl)
    }
    var scrollEl;
    module.exports = function(a, b) {
        $(getScrollEl()).animate({
            scrollTop: a
        }, b)
    }
});
define("app/ui/global_nav", ["module", "require", "exports", "core/component", "app/utils/full_path", "app/utils/animate_window_scrolltop"], function(module, require, exports) {
    function globalNav() {
        this.defaultAttrs({
            activeClass: "active",
            newClass: "new",
            nav: "li",
            meNav: "li.profile",
            navLinkSelector: "li > a",
            linkSelector: "a"
        }), this.updateActive = function(a, b) {
            b && (this.select("nav").removeClass(this.attr.activeClass), this.select("nav").filter("[data-global-action=" + b.section + "]").addClass(this.attr.activeClass), this.removeGlowFromActive())
        }, this.addGlowToActive = function() {
            this.$node.find("." + this.attr.activeClass).addClass(this.attr.newClass)
        }, this.addGlowToMe = function() {
            this.select("meNav").addClass(this.attr.newClass)
        }, this.removeGlowFromActive = function() {
            this.$node.find("." + this.attr.activeClass).not(this.attr.meNav).removeClass(this.attr.newClass)
        }, this.removeGlowFromMe = function() {
            this.select("meNav").removeClass(this.attr.newClass)
        }, this.scrollToTopLink = function(a) {
            var b = $(a.target).closest(this.attr.linkSelector);
            b.attr("href") == fullPath() && (a.preventDefault(), b.blur(), this.scrollToTop())
        }, this.scrollToTop = function() {
            animateWinScrollTop(0, "fast"), this.trigger(document, "uiGotoTopOfScreen")
        }, this.after("initialize", function() {
            this.on(document, "uiAddPageCount", this.addGlowToActive), this.on(document, "uiHasInjectedNewTimeline", this.removeGlowFromActive), this.on(document, "dataPageRefresh", this.updateActive), this.on(document, "dataUserHasUnreadDMs", this.addGlowToMe), this.on(document, "dataUserHasNoUnreadDMs", this.removeGlowFromMe), this.on(".bird-topbar-etched", "click", this.scrollToTop), this.on("click", {
                navLinkSelector: this.scrollToTopLink
            })
        })
    }
    var defineComponent = require("core/component"),
        fullPath = require("app/utils/full_path"),
        animateWinScrollTop = require("app/utils/animate_window_scrolltop"),
        GlobalNav = defineComponent(globalNav);
    module.exports = GlobalNav
});
define("app/ui/navigation_links", ["module", "require", "exports", "core/component"], function(module, require, exports) {
    function navigationLinks() {
        this.defaultAttrs({
            navSelector: "a[data-nav]"
        }), this.navEvent = function(a) {
            var b = $(a.target).closest("a[data-nav]");
            this.trigger("uiNavigationLinkClick", {
                scribeContext: {
                    element: b.attr("data-nav")
                },
                url: b.attr("href")
            })
        }, this.after("initialize", function() {
            this.on(this.select("navSelector"), "click", this.navEvent)
        })
    }
    var defineComponent = require("core/component");
    module.exports = defineComponent(navigationLinks)
});
define("app/boot/top_bar", ["module", "require", "exports", "app/boot/tweet_boxes", "app/ui/user_dropdown", "app/ui/signin_dropdown", "app/ui/search_input", "app/ui/global_nav", "app/ui/navigation_links", "app/ui/typeahead/typeahead_dropdown", "app/ui/typeahead/typeahead_input", "core/utils"], function(module, require, exports) {
    function initialize(a) {
        GlobalNav.attachTo("#global-actions"), SearchInput.attachTo("#global-nav-search", utils.merge(a, {
            eventData: {
                scribeContext: {
                    component: "top_bar_searchbox",
                    element: ""
                }
            }
        })), TypeaheadInput.attachTo("#global-nav-search", {
            autocompleteAccounts: !1
        }), TypeaheadDropdown.attachTo("#global-nav-search", {
            datasources: ["accounts", "savedSearches", "topics"],
            accountsShortcutShow: !0,
            deciders: a.typeaheadData,
            eventData: {
                scribeContext: {
                    component: "top_bar_searchbox",
                    element: "typeahead"
                }
            }
        }), a.loggedIn ? (tweetBoxes(a), UserDropdown.attachTo("#user-dropdown", {
            signout: "#signout-button",
            signoutForm: "#signout-form",
            toggler: "#user-dropdown-toggle",
            directMessages: ".js-dm-dialog",
            keyboardShortcuts: ".js-keyboard-shortcut-trigger",
            dmCount: ".js-direct-message-count",
            glowClass: "new"
        })) : SigninDropdown.attachTo(".js-session"), NavigationLinks.attachTo(".global-nav", {
            eventData: {
                scribeContext: {
                    component: "top_bar"
                }
            }
        })
    }
    var tweetBoxes = require("app/boot/tweet_boxes"),
        UserDropdown = require("app/ui/user_dropdown"),
        SigninDropdown = require("app/ui/signin_dropdown"),
        SearchInput = require("app/ui/search_input"),
        GlobalNav = require("app/ui/global_nav"),
        NavigationLinks = require("app/ui/navigation_links"),
        TypeaheadDropdown = require("app/ui/typeahead/typeahead_dropdown"),
        TypeaheadInput = require("app/ui/typeahead/typeahead_input"),
        utils = require("core/utils");
    module.exports = initialize
});
define("app/ui/keyboard_shortcuts", ["module", "require", "exports", "core/component", "core/utils"], function(module, require, exports) {
    function keyBoardShortcuts() {
        this.shortcutEvents = {
            f: "uiShortcutFavorite",
            r: "uiShortcutReply",
            t: "uiShortcutRetweet",
            b: "uiShortcutBlock",
            u: "uiShortcutUnblock",
            j: "uiShortcutSelectNext",
            k: "uiShortcutSelectPrev",
            l: "uiShortcutCloseAll",
            ".": "uiShortcutGotoTopOfScreen",
            "/": "uiShortcutGotoSearch",
            X: "uiShortcutEsc",
            E: "uiShortcutEnter",
            "<": "uiShortcutLeft",
            ">": "uiShortcutRight",
            gh: "uiShortcutNavigateHome",
            ga: "uiShortcutNavigateActivity",
            gc: "uiShortcutNavigateConnect",
            gr: "uiShortcutNavigateMentions",
            gd: "uiShortcutNavigateDiscover",
            gp: "uiShortcutNavigateProfile",
            gf: "uiShortcutNavigateFavorites",
            gs: "uiShortcutNavigateSettings",
            gl: "uiShortcutNavigateLists",
            m: "uiShortcutNewDM",
            n: "uiShortcutShowTweetbox",
            gu: "uiShortcutShowGotoUser",
            gm: "uiShortcutShowDMs",
            sp: "uiShortcutShowSearchPhotos",
            sv: "uiShortcutShowSearchVideos",
            "?": "uiOpenKeyboardShortcutsDialog"
        }, this.defaultEventBehaviors = {
            uiShortcutEsc: "blurTextField",
            uiShortcutGotoSearch: "focusSearch"
        }, this.lastKey = "", this.defaultAttrs({
            globalSearchBoxSelector: "#search-query"
        }), this.isModifier = function(a) {
            return !!(a.shiftKey || a.metaKey || a.ctrlKey || a.altKey)
        }, this.charFromKeyCode = function(a, b) {
            return b && shiftKeyMap[a] ? shiftKeyMap[a] : keyMap[a] || String.fromCharCode(a).toLowerCase()
        }, this.isTextField = function(a) {
            if (!a || !a.tagName) return !1;
            var b = a.tagName.toLowerCase();
            if (b == "textarea" || a.getAttribute("contenteditable")) return !0;
            if (b != "input") return !1;
            var c = (a.getAttribute("type") || "text").toLowerCase();
            return textInputs[c]
        }, this.isWhiteListedElement = function(a) {
            var b = a.tagName.toLowerCase();
            if (whiteListedElements[b]) return !0;
            if (b != "input") return !1;
            var c = a.getAttribute("type").toLowerCase();
            return whiteListedInputs[c]
        }, this.triggerShortcut = function(a) {
            var b = this.charFromKeyCode(a.keyCode || a.which, a.shiftKey),
                c, d, e;
            if ((c = this.shortcutEvents[this.lastKey + b] || this.shortcutEvents[b]) && b != this.lastKey) {
                a.preventDefault();
                if (e = this.defaultEventBehaviors[c]) d = {
                    type: c,
                    defaultBehavior: function() {
                        this[e](a)
                    }
                };
                this.trigger(a.target, d || c, {
                    fromShortcut: !0
                }), this.lastKey = "";
                return
            }
            setTimeout(function() {
                this.lastKey = ""
            }.bind(this), 5e3), this.lastKey = b
        }, this.onKeyDown = function(a) {
            var b = a.keyCode,
                c = b == 13,
                d = a.target;
            if (b != 27 && this.isTextField(d) || this.isModifier(a) && (c || !shiftKeyMap[a.keyCode])) return;
            if (c && this.isWhiteListedElement(d)) return;
            this.triggerShortcut(a)
        }, this.blurTextField = function(a) {
            var b = a.target;
            this.isTextField(b) && b.blur()
        }, this.focusSearch = function(a) {
            this.select("globalSearchBoxSelector").focus()
        }, this.after("initialize", function() {
            this.on("keydown", this.onKeyDown)
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        keyMap = {
            13: "E",
            27: "X",
            191: "/",
            190: ".",
            37: "<",
            39: ">"
        }, shiftKeyMap = {
            191: "?"
        }, whiteListedElements = {
            button: !0,
            a: !0
        }, whiteListedInputs = {
            button: !0,
            submit: !0,
            file: !0
        }, textInputs = {
            password: !0,
            text: !0,
            email: !0
        }, KeyBoardShortcuts = defineComponent(keyBoardShortcuts);
    module.exports = KeyBoardShortcuts
});
provide("app/ui/dialogs/keyboard_shortcuts_dialog", function(a) {
    using("core/component", "app/ui/with_dialog", "app/ui/with_position", function(b, c, d) {
        function f() {
            this.after("initialize", function() {
                this.on("click", this.close), this.on(document, "uiOpenKeyboardShortcutsDialog", this.open)
            })
        }
        var e = b(f, c, d);
        a(e)
    })
})
define("app/ui/dialogs/with_modal_tweet", ["module", "require", "exports"], function(module, require, exports) {
    function withModalTweet() {
        this.defaultAttrs({
            modalTweetSelector: ".modal-tweet"
        }), this.addTweet = function(a) {
            this.select("modalTweetSelector").show(), this.select("modalTweetSelector").empty().append(a)
        }, this.removeTweet = function() {
            this.select("modalTweetSelector").hide().empty()
        }, this.after("initialize", function() {
            this.on(document, "uiDialogClosed", this.removeTweet)
        })
    }
    module.exports = withModalTweet
});
provide("app/ui/dialogs/retweet_dialog", function(a) {
    using("core/component", "app/ui/with_dialog", "app/ui/with_position", "app/ui/dialogs/with_modal_tweet", function(b, c, d, e) {
        function g() {
            this.defaults = {
                cancelSelector: ".cancel-action",
                retweetSelector: ".retweet-action"
            }, this.openRetweet = function(a, b) {
                this.attr.sourceEventData = b, this.removeTweet(), this.addTweet($(a.target).clone()), this.open()
            }, this.retweet = function() {
                this.trigger("uiDidRetweet", this.attr.sourceEventData)
            }, this.retweetSuccess = function(a, b) {
                this.trigger("uiDidRetweetSuccess", this.attr.sourceEventData), this.close()
            }, this.after("initialize", function() {
                this.on("click", {
                    cancelSelector: this.close,
                    retweetSelector: this.retweet
                }), this.on(document, "uiOpenRetweetDialog", this.openRetweet), this.on(document, "dataDidRetweet", this.retweetSuccess)
            })
        }
        var f = b(g, c, d, e);
        a(f)
    })
})
provide("app/ui/dialogs/delete_tweet_dialog", function(a) {
    using("core/component", "app/ui/with_dialog", "app/ui/with_position", "app/ui/dialogs/with_modal_tweet", function(b, c, d, e) {
        function g() {
            this.defaults = {
                cancelSelector: ".cancel-action",
                deleteSelector: ".delete-action"
            }, this.openDeleteTweet = function(a, b) {
                this.attr.sourceEventData = b, this.addTweet($(a.target).clone()), this.id = b.id, this.open()
            }, this.deleteTweet = function() {
                this.trigger("uiDidDeleteTweet", {
                    id: this.id,
                    sourceEventData: this.attr.sourceEventData
                })
            }, this.deleteTweetSuccess = function(a, b) {
                this.trigger("uiDidDeleteTweetSuccess", this.attr.sourceEventData), this.close()
            }, this.after("initialize", function() {
                this.on("click", {
                    cancelSelector: this.close,
                    deleteSelector: this.deleteTweet
                }), this.on(document, "uiOpenDeleteDialog", this.openDeleteTweet), this.on(document, "dataDidDeleteTweet", this.deleteTweetSuccess)
            })
        }
        var f = b(g, c, d, e);
        a(f)
    })
})
provide("app/ui/dialogs/block_user_dialog", function(a) {
    using("core/component", "app/ui/with_dialog", "app/ui/with_position", "app/ui/dialogs/with_modal_tweet", function(b, c, d, e) {
        function g() {
            this.defaults = {
                cancelSelector: ".cancel-action",
                blockSelector: ".block-action",
                timeSelector: ".time",
                dogearSelector: ".dogear",
                tweetTextSelector: ".js-tweet-text"
            }, this.openBlockUser = function(a, b) {
                this.attr.sourceEventData = b, this.addTweet($(a.target.children[0]).clone()), this.cleanUpTweet(), this.open()
            }, this.cleanUpTweet = function() {
                this.$node.find(this.attr.timeSelector).remove(), this.$node.find(this.attr.dogearSelector).remove(), this.$node.find(this.attr.tweetTextSelector).remove()
            }, this.blockUser = function() {
                this.trigger("uiDidBlockUser", {
                    sourceEventData: this.attr.sourceEventData
                }), this.close()
            }, this.after("initialize", function() {
                this.on("click", {
                    cancelSelector: this.close,
                    blockSelector: this.blockUser
                }), this.on(document, "uiOpenBlockUserDialog", this.openBlockUser)
            })
        }
        var f = b(g, c, d, e);
        a(f)
    })
})
provide("app/ui/dialogs/confirm_dialog", function(a) {
    using("core/component", "app/ui/with_dialog", "app/ui/with_position", "app/utils/with_event_params", function(b, c, d, e) {
        function g() {
            this.defaultAttrs({
                titleSelector: ".modal-title",
                modalBodySelector: ".modal-body",
                bodySelector: ".modal-body-text",
                cancelSelector: "#confirm_dialog_cancel_button",
                submitSelector: "#confirm_dialog_submit_button"
            }), this.openWithOptions = function(a, b) {
                this.attr.eventParams = {
                    action: b.action
                }, this.attr.top = b.top, this.select("titleSelector").text(b.titleText), b.bodyText ? (this.select("bodySelector").text(b.bodyText), this.select("modalBodySelector").show()) : this.select("modalBodySelector").hide(), this.select("cancelSelector").text(b.cancelText), this.select("submitSelector").text(b.submitText), this.open()
            }, this.submit = function(a, b) {
                this.trigger("ui{{action}}Confirm")
            }, this.cancel = function(a, b) {
                this.trigger("ui{{action}}Cancel")
            }, this.after("initialize", function() {
                this.on(document, "uiOpenConfirmDialog", this.openWithOptions), this.on(this.select("submitSelector"), "click", this.submit), this.on(this.select("submitSelector"), "click", this.close), this.on(this.select("cancelSelector"), "click", this.cancel), this.on(this.select("cancelSelector"), "click", this.close), this.on("uiDialogCloseRequested", this.cancel)
            })
        }
        var f = b(g, c, d, e);
        a(f)
    })
})
define("app/ui/dialogs/list_membership_dialog", ["module", "require", "exports", "core/component", "app/ui/with_position", "app/ui/with_dialog"], function(module, require, exports) {
    function listMembershipDialog() {
        this.defaultAttrs({
            top: 90,
            contentSelector: ".list-membership-content",
            createListSelector: ".create-a-list",
            membershipSelector: ".list-membership-container li"
        }), this.openListMembershipDialog = function(a, b) {
            this.userId = b.userId, this.userId && this.trigger("uiNeedsListMembershipContent", {
                userId: this.userId
            }), this.$content.empty(), this.$node.removeClass("has-content"), this.open()
        }, this.addListMembershipContent = function(a, b) {
            this.$node.addClass("has-content"), this.$content.html(b.html)
        }, this.handleNoListMembershipContent = function(a, b) {
            this.close(), this.trigger("uiShowError", b)
        }, this.toggleListMembership = function(a, b) {
            var c = $(a.target),
                d = {
                    userId: c.closest("[data-user-id]").attr("data-user-id"),
                    listId: c.closest("[data-list-id]").attr("data-list-id")
                }, e = $("#list_" + d.listId);
            if (!e.is(":visible")) return;
            e.closest(this.attr.membershipSelector).addClass("pending"), e.data("is-checked") ? this.trigger("uiRemoveUserFromList", d) : this.trigger("uiAddUserToList", d)
        }, this.updateMembershipState = function(a) {
            return function(b, c) {
                var d = $("#list_" + c.sourceEventData.listId);
                d.closest(this.attr.membershipSelector).removeClass("pending"), d.attr("checked", a ? "checked" : null), d.data("is-checked", a), d.attr("data-is-checked", a)
            }.bind(this)
        }, this.openListCreateDialog = function() {
            this.close(), this.trigger("uiOpenCreateListDialog", {
                userId: this.userId
            })
        }, this.after("initialize", function(a) {
            this.$content = this.select("contentSelector"), this.on("click", {
                createListSelector: this.openListCreateDialog,
                membershipSelector: this.toggleListMembership
            }), this.on(document, "uiListAction uiOpenListMembershipDialog", this.openListMembershipDialog), this.on(document, "dataGotListMembershipContent", this.addListMembershipContent), this.on(document, "dataFailedToGetListMembershipContent", this.handleNoListMembershipContent), this.on(document, "dataDidAddUserToList dataFailedToRemoveUserFromList", this.updateMembershipState(!0)), this.on(document, "dataDidRemoveUserFromList dataFailedToAddUserToList", this.updateMembershipState(!1))
        })
    }
    var defineComponent = require("core/component"),
        withPosition = require("app/ui/with_position"),
        withDialog = require("app/ui/with_dialog"),
        ListMembershipDialog = defineComponent(listMembershipDialog, withDialog, withPosition);
    module.exports = ListMembershipDialog
});
define("app/ui/dialogs/list_operations_dialog", ["module", "require", "exports", "core/component", "app/ui/with_position", "app/ui/with_dialog", "core/i18n", "core/utils"], function(module, require, exports) {
    function listOperationsDialog() {
        this.defaultAttrs({
            top: 90,
            win: window,
            saveListSelector: ".update-list-button",
            editorSelector: ".list-editor",
            nameInputSelector: ".list-editor input[name='name']",
            descriptionSelector: ".list-editor textarea[name='description']",
            privacySelector: ".list-editor input[name='mode']",
            modalTitleSelector: ".modal-title"
        }), this.openListOperationsDialog = function(a, b) {
            this.userId = b.userId, a.type == "uiOpenUpdateListDialog" && this.modifyDialog(), this.open(), this.$nameInput.focus()
        }, this.modifyDialog = function() {
            this.$modalTitle = this.select("modalTitleSelector"), this.originalTitle = this.originalTitle || this.$modalTitle.text(), this.$modalTitle.text(_('Edit list details')), this.$nameInput.val($(".follow-card h1.js-list-name").text()), this.$descriptionInput.val($(".follow-card p.bio").text()), this.attr.is_public || (this.$privacyInput[1].checked = !0), this.$saveButton.attr("data-list-id", this.attr.list_id).attr("data-operation", "update"), this.toggleSaveButtonDisabled(), this.modified = !0
        }, this.revertModifications = function() {
            this.modified && (this.revertDialog(), this.$editor.find("input,textarea").val(""), this.modified = !1)
        }, this.revertDialog = function() {
            this.$modalTitle.text(this.originalTitle), this.$saveButton.removeAttr("data-list-id").removeAttr("data-operation"), this.attr.is_public || (this.$privacyInput[0].checked = !0)
        }, this.saveList = function(a, b) {
            if (this.requestInProgress) return;
            this.requestInProgress = !0;
            var c = $(b.el),
                d = c.attr("data-operation") == "update" ? "uiUpdateList" : "uiCreateList",
                e = {
                    name: this.formValue("name"),
                    description: this.formValue("description", {
                        type: "textarea"
                    }),
                    mode: this.formValue("mode", {
                        conditions: ":checked"
                    })
                };
            c.attr("data-operation") == "update" && (e = utils.merge(e, {
                list_id: c.attr("data-list-id")
            })), this.trigger(d, e), this.$saveButton.attr("disabled", !0)
        }, this.saveListSuccess = function(a, b) {
            this.close();
            var c = _('List saved!');
            a.type == "dataDidCreateList" ? (c = _('List created!'), this.userId ? this.trigger("uiOpenListMembershipDialog", {
                userId: this.userId
            }) : b && b.slug && (this.attr.win.location = "/" + this.attr.screenName + "/" + b.slug)) : this.revertDialog(), this.$editor.find("input,textarea").val(""), this.trigger("uiShowMessage", {
                message: c
            })
        }, this.saveListComplete = function(a, b) {
            this.requestInProgress = !1, this.toggleSaveButtonDisabled()
        }, this.toggleSaveButtonDisabled = function(a, b) {
            this.$saveButton.attr("disabled", this.$nameInput.val() == "")
        }, this.formValue = function(a, b) {
            return b = b || {}, b.type = b.type || "input", b.conditions = b.conditions || "", this.$editor.find(b.type + "[name='" + a + "']" + b.conditions).val()
        }, this.disableSaveButton = function() {
            this.$saveButton.attr("disabled", !0)
        }, this.after("initialize", function(a) {
            this.$editor = this.select("editorSelector"), this.$nameInput = this.select("nameInputSelector"), this.$descriptionInput = this.select("descriptionSelector"), this.$privacyInput = this.select("privacySelector"), this.$saveButton = this.select("saveListSelector"), this.on("click", {
                saveListSelector: this.saveList
            }), this.on("focus blur keyup", {
                nameInputSelector: this.toggleSaveButtonDisabled
            }), this.on("uiDialogClosed", this.revertModifications), this.on(document, "uiOpenCreateListDialog uiOpenUpdateListDialog", this.openListOperationsDialog), this.on(document, "dataDidCreateList dataDidUpdateList", this.saveListSuccess), this.on(document, "dataDidCreateList dataDidUpdateList dataFailedToCreateList dataFailedToUpdateList", this.saveListComplete), this.on(document, "uiSwiftLoaded uiPageChanged", this.disableSaveButton)
        })
    }
    var defineComponent = require("core/component"),
        withPosition = require("app/ui/with_position"),
        withDialog = require("app/ui/with_dialog"),
        _ = require("core/i18n"),
        utils = require("core/utils"),
        ListOperationsDialog = defineComponent(listOperationsDialog, withDialog, withPosition);
    module.exports = ListOperationsDialog
});
define("app/data/direct_messages", ["module", "require", "exports", "core/component", "app/data/with_data", "app/data/with_auth_token", "app/utils/storage/core"], function(module, require, exports) {
    function directMessages() {
        this.defaultAttrs({
            noShowError: !0,
            lastReadMessageIdKey: "lastReadMessageId"
        }), this.pollConversationList = function(a, b) {
            this.requestConversationList(null, {
                since_id: this.lastMessageId
            })
        }, this.updateLastReceivedId = function(a, b) {
            this.lastMessageId = b.last_message_id, this.saveLastReceivedId(b.last_message_id)
        }, this.saveLastReceivedId = function(a) {
            this.storage.setItem(this.attr.lastReadMessageIdKey, a), this.trigger("dataUserHasNoUnreadDMs")
        }, this.requestConversationList = function(a, b) {
            this.get({
                url: "/messages",
                data: b,
                eventData: b,
                success: "dataDMConversationListResult",
                error: "dataDMError"
            })
        }, this.requestConversation = function(a, b) {
            this.get({
                url: "/messages/with/" + b.screen_name,
                data: {},
                eventData: b,
                success: "dataDMConversationResult",
                error: "dataDMError"
            })
        }, this.sendMessage = function(a, b) {
            this.post({
                url: "/direct_messages/new",
                data: b,
                eventData: b,
                success: "dataDMSuccess",
                error: "dataDMError"
            })
        }, this.deleteMessage = function(a, b) {
            this.post({
                url: "/direct_messages/destroy",
                data: b,
                eventData: b,
                success: "dataDMSuccess",
                error: "dataDMError"
            })
        }, this.checkLastReadDM = function(a, b) {
            var c = this.attr.latest_incoming_direct_message_id,
                d = this.storage.getItem(this.attr.lastReadMessageIdKey);
            d ? c > d && this.trigger("dataUserHasUnreadDMs") : this.saveLastReceivedId(c)
        }, this.possiblyOpenDMDialog = function(a, b) {
            var c = this.attr.dm_options;
            if (c && c.show_dm_dialog) {
                var d = c.recipient;
                $(document).trigger("uiNeedsDMDialog"), d && $(document).trigger("uiOpenDMConversation", {
                    screen_name: d
                })
            }
        }, this.after("initialize", function() {
            this.on("uiNeedsDMConversationList", this.requestConversationList), this.on("uiNeedsDMConversation", this.requestConversation), this.on("uiDMDialogSendMessage", this.sendMessage), this.on("uiDMDialogDeleteMessage", this.deleteMessage), this.on("dataRefreshDMs", this.pollConversationList), this.on("dataDMConversationListResult", this.updateLastReceivedId), this.on("uiSwiftLoaded uiPageChanged", this.checkLastReadDM), this.on("uiSwiftLoaded", this.possiblyOpenDMDialog), this.lastMessageId = $("#dm_dialog_conversation_list li.dm-thread").first().attr("data-last-message-id") || 0, this.storage = new Storage("DM")
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data"),
        withAuthToken = require("app/data/with_auth_token"),
        Storage = require("app/utils/storage/core"),
        DirectMessages = defineComponent(directMessages, withData, withAuthToken);
    module.exports = DirectMessages
});
define("app/data/direct_messages_scribe", ["module", "require", "exports", "core/component", "app/data/with_scribe"], function(module, require, exports) {
    function directMessagesScribe() {
        this.after("initialize", function() {
            this.scribeOnEvent("uiDMDialogOpenedNewConversation", "open"), this.scribeOnEvent("uiDMDialogOpenedConversation", "open"), this.scribeOnEvent("uiDMDialogOpenedConversationList", "open"), this.scribeOnEvent("uiDMDialogSendMessage", "send_dm"), this.scribeOnEvent("uiDMDialogDeleteMessage", "delete")
        })
    }
    var defineComponent = require("core/component"),
        withScribe = require("app/data/with_scribe"),
        DirectMessagesScribe = defineComponent(directMessagesScribe, withScribe);
    module.exports = DirectMessagesScribe
});
define("app/ui/with_timestamp_updating", ["module", "require", "exports", "core/utils", "lib/twitter_cldr", "core/i18n"], function(module, require, exports) {
    function withTimestampUpdating() {
        this.defaultAttrs({
            timestampSelector: ".js-relative-timestamp",
            timestampClass: "js-relative-timestamp"
        }), this.monthLabels = TwitterCldr.Calendar.months({
            names_form: "abbreviated"
        }), this.currentTimeSecs = function() {
            return new Date / 1e3
        }, this.updateTimestamps = function() {
            var a = this,
                b = a.currentTimeSecs(),
                c = !0,
                d = new TwitterCldr.TimespanFormatter,
                e = new TwitterCldr.DateTimeFormatter;
            this.select("timestampSelector").each(function() {
                var f = $(this).data("time"),
                    g = b - f,
                    h;
                g < 3 ? h = _('now') : g >= d.time_in_seconds.year ? (h = e.format(new Date(f * 1e3), {
                    format: "additional",
                    type: "yMMMd"
                }), c = !1) : g >= d.time_in_seconds.day ? (h = e.format(new Date(f * 1e3), {
                    format: "additional",
                    type: "MMMd"
                }), c = !1) : h = d.format(g, {
                    direction: "none",
                    type: "short"
                }), c || $(this).removeClass(a.attr.timestampClass), $(this).html(h)
            })
        }, this.after("initialize", function(a) {
            this.on(document, "uiWantsToRefreshTimestamps uiPageChanged", this.updateTimestamps)
        })
    }
    var utils = require("core/utils"),
        TwitterCldr = require("lib/twitter_cldr"),
        _ = require("core/i18n");
    module.exports = withTimestampUpdating
});
define("app/ui/direct_message_dialog", ["module", "require", "exports", "core/component", "app/ui/with_dialog", "app/ui/with_position", "app/ui/with_timestamp_updating"], function(module, require, exports) {
    function directMessageDialog() {
        this.defaultAttrs({
            dialogSelector: "#dm_dialog",
            closeSelector: ".twttr-dialog-close",
            classConversationList: "dm-conversation-list",
            classConversation: "dm-conversation",
            classNew: "dm-new",
            viewConversationList: "#dm_dialog_conversation_list",
            viewConversation: "#dm_dialog_conversation",
            viewNew: "#dm_dialog_new",
            linksForConversationListView: "#dm_dialog_new h3 a, #dm_dialog_conversation h3 a",
            linksForConversationView: ".dm-thread",
            linksForNewView: ".dm-new-button",
            contentSelector: ".twttr-dialog-content",
            tweetBoxSelector: ".dm-tweetbox",
            deleteSelector: ".dm-delete",
            deleteConfirmSelector: ".dm-deleting .js-prompt-ok",
            deleteCancelSelector: ".dm-deleting .js-prompt-cancel",
            autocompleteImage: "img.selected-profile",
            autocompleteInput: "input.twttr-directmessage-input",
            errorContainerSelector: ".js-dm-error",
            errorTextSelector: ".dm-error-text",
            errorCloseSelector: ".js-dismiss"
        }), this.openDialog = function(a, b) {
            this.open(), this.trigger("dataRefreshDMs"), this.renderConversationListView()
        }, this.openConversation = function(a, b) {
            this.trigger("dataRefreshDMs"), this.renderConversationView(null, b), this.open()
        }, this.renderConversationListView = function(a, b) {
            a && a.preventDefault(), this.renderView(this.attr.classConversationList);
            var c = this.select("viewConversationList");
            if (c.hasClass("needs-refresh")) {
                c.removeClass("needs-refresh"), this.trigger("uiNeedsDMConversationList", {
                    since_id: 0
                });
                return
            }
            this.trigger("uiDMDialogOpenedConversationList")
        }, this.renderConversationView = function(a, b) {
            this.deleteCancel(), a && a.preventDefault();
            var b = b || {}, c = b.screen_name || $(b.el).data("thread-id"),
                d = b.name || $(b.el).find(".fullname").text();
            this.$node.find(".dm_dialog_real_name").text(d), this.select("viewConversation").find(this.attr.contentSelector).empty(), this.renderView(this.attr.classConversation), this.trigger("uiDMDialogOpenedConversation", {
                recipient: c
            }), conversationCache[c] ? this.updateConversation(null, conversationCache[c]) : this.trigger("uiNeedsDMConversation", {
                screen_name: c
            }), this.resetDMBox()
        }, this.renderNewView = function(a, b) {
            a && a.preventDefault();
            var c = this.select("autocompleteImage").attr("data-default-img");
            this.trigger("uiDMDialogOpenedNewConversation"), this.renderView(this.attr.classNew), this.resetDMBox(), this.select("autocompleteImage").attr("src", c), this.select("autocompleteInput").val("").focus()
        }, this.renderView = function(a) {
            this.hideError(), this.$dialogContainer.removeClass(this.viewClasses).addClass(a), this.attr.eventData || (this.attr.eventData = {});
            var b;
            switch (a) {
                case this.attr.classNew:
                    b = "dm_new_conversation_dialog";
                    break;
                case this.attr.classConversation:
                    b = "dm_existing_conversation_dialog";
                    break;
                case this.attr.classConversationList:
                    b = "dm_conversation_list_dialog"
            }
            this.attr.eventData.scribeContext = {
                component: b
            }
        }, this.updateConversationList = function(a, b) {
            var c = this.select("viewConversationList"),
                d = c.find("li");
            b.sourceEventData.since_id ? d.filter(function() {
                return $.inArray($(this).data("thread-id"), b.threads) > -1
            }).remove() : d.remove();
            var e = b.html || "";
            c.find(this.attr.contentSelector + " ul").prepend(e);
            var f = c.find(".dm-no-messages");
            c.find("li").length == 0 ? f.addClass("show") : f.removeClass("show")
        }, this.updateConversation = function(a, b) {
            a && a.preventDefault(), conversationCache[b.recipient.screen_name] = b, this.$node.find(".dm_dialog_real_name").text(b.recipient && b.recipient.name), this.$dialogContainer.hasClass(this.attr.classConversation) || this.renderConversationView(null, {
                screen_name: b.recipient.screen_name,
                name: b.recipient.name
            });
            var c = this.select("viewConversation").find(this.attr.contentSelector);
            c.html(b.html);
            if (!c.find(".js-dm-item").length) {
                this.trigger("dataRefreshDMs"), this.renderConversationListView();
                return
            }
            var d = c.find(".dm-convo");
            d.length && d.scrollTop(d[0].scrollHeight)
        }, this.sendMessage = function(a, b) {
            var c = this.$dialogContainer.hasClass(this.attr.classConversation),
                d = b.recipient;
            !d && c ? d = this.select("viewConversation").find("div[data-thread-id]").data("thread-id") : d || (d = this.select("viewNew").find("input[type=text]").val().trim());
            if (!d) {
                setTimeout(function() {
                    this.sendMessage(a, b)
                }.bind(this), 100);
                return
            }
            this.trigger("uiDMDialogSendMessage", {
                tweetboxId: b.tweetboxId,
                screen_name: d.replace(/^@/, ""),
                text: b.tweetData.status
            }), this.resetDMBox(), this.select("viewConversationList").addClass("needs-refresh")
        }, this.selectAutocompleteUser = function(a, b) {
            var c = b.item ? b.item.screen_name : b.screen_name,
                d = b.item ? b.item.name : b.name,
                e = this.select("viewConversationList").find("li[data-thread-id=" + c + "]").length;
            e ? this.renderConversationView(null, {
                screen_name: c,
                name: d
            }) : (this.select("autocompleteInput").val(c), this.select("autocompleteImage").attr("src", this.getUserAvatar(b.item ? b.item : b)))
        }, this.getUserAvatar = function(a) {
            var b = window.location.protocol === "https:" ? a.profile_image_url_https : a.profile_image_url;
            return b.replace(/_normal(\..*)?$/i, "_mini$1")
        }, this.deleteMessage = function(a, b) {
            this.select("tweetBoxSelector").addClass("dm-deleting").find(".dm-delete-confirm .js-prompt-ok").focus(), this.select("viewConversation").find(".marked-for-deletion").removeClass("marked-for-deletion"), $(a.target).closest(".dm").addClass("marked-for-deletion")
        }, this.deleteConfirm = function(a, b) {
            var c = this.select("viewConversation").find(".marked-for-deletion");
            this.trigger("uiDMDialogDeleteMessage", {
                id: c.attr("data-message-id")
            }), this.select("viewConversationList").addClass("needs-refresh"), this.select("tweetBoxSelector").removeClass("dm-deleting")
        }, this.deleteCancel = function(a, b) {
            this.select("tweetBoxSelector").removeClass("dm-deleting"), this.select("viewConversation").find(".marked-for-deletion").removeClass("marked-for-deletion")
        }, this.showError = function(a, b) {
            this.select("errorTextSelector").html(b.message || b.error), this.select("errorContainerSelector").show()
        }, this.hideError = function(a, b) {
            this.select("errorContainerSelector").hide()
        }, this.resetDMBox = function() {
            this.select("tweetBoxSelector").trigger("uiDMBoxReset")
        }, this.after("initialize", function() {
            this.$dialogContainer = this.select("dialogSelector"), this.viewClasses = [this.attr.classConversationList, this.attr.classConversation, this.attr.classNew].join(" "), this.on(document, "uiNeedsDMDialog uiShortcutShowDMs uiShortcutNewDM", this.openDialog), this.on(document, "uiOpenDMConversation", this.openConversation), this.on(document, "dataDMConversationListResult", this.updateConversationList), this.on(document, "dataDMSuccess dataDMConversationResult", this.updateConversation), this.on(document, "uiSendDM", this.sendMessage), this.on(document, "dataDMError", this.showError), this.on(document, "uiShortcutNewDM", this.renderNewView), this.on("uiSendAutocompleteData", this.selectAutocompleteUser), this.on("uiTypeaheadItemSelected uiTypeaheadItemComplete", this.selectAutocompleteUser), this.on("click", {
                linksForConversationListView: this.renderConversationListView,
                linksForConversationView: this.renderConversationView,
                linksForNewView: this.renderNewView,
                deleteSelector: this.deleteMessage,
                deleteConfirmSelector: this.deleteConfirm,
                deleteCancelSelector: this.deleteCancel,
                errorCloseSelector: this.hideError
            })
        })
    }
    var defineComponent = require("core/component"),
        withDialog = require("app/ui/with_dialog"),
        withPosition = require("app/ui/with_position"),
        withTimestampUpdating = require("app/ui/with_timestamp_updating"),
        DirectMessageDialog = defineComponent(directMessageDialog, withDialog, withPosition, withTimestampUpdating),
        conversationCache = {};
    module.exports = DirectMessageDialog
});
define("app/boot/direct_messages", ["module", "require", "exports", "core/clock", "app/data/direct_messages", "app/data/direct_messages_scribe", "app/data/autocomplete", "app/ui/autocomplete_dropdown", "core/utils", "app/ui/typeahead/typeahead_dropdown", "app/ui/typeahead/typeahead_input", "app/ui/direct_message_dialog", "app/ui/tweet_box"], function(module, require, exports) {
    function initialize(a) {
        DirectMessagesData.attachTo(document, a), DirectMessagesScribe.attachTo(document, a), DirectMessageDialog.attachTo("#dm_dialog", a);
        var b = {
            scribeContext: {
                component: "tweet_box_dm"
            }
        };
        TweetBox.attachTo("#dm_dialog form.tweet-form", {
            eventParams: {
                type: "DM"
            },
            suppressFlashMessage: !0,
            eventData: b
        }), a.useTypeaheadEverywhere ? (TypeaheadInput.attachTo("#dm_dialog_new .dm-dialog-content", {
            inputSelector: "input.twttr-directmessage-input",
            eventData: b
        }), TypeaheadDropdown.attachTo("#dm_dialog_new .dm-dialog-content", {
            inputSelector: "input.twttr-directmessage-input",
            datasources: ["dmAccounts"],
            blockLinkActions: !0,
            deciders: a.typeaheadData,
            eventData: b
        })) : (AutocompleteData.attachTo("#dm_dialog_new .dm-dialog-content", utils.push(a, {
            triggerToken: "",
            filterByDmAccess: !0
        })), AutocompleteDropdown.attachTo("#dm_dialog_new .dm-dialog-content", utils.merge(a, {
            autocompleteInputSelector: "input.twttr-directmessage-input",
            typeaheadInterestingWordRegexp: /^[^\s]+/,
            filterByDmAccess: !0,
            eventData: b
        })))
    }
    var clock = require("core/clock"),
        DirectMessagesData = require("app/data/direct_messages"),
        DirectMessagesScribe = require("app/data/direct_messages_scribe"),
        AutocompleteData = require("app/data/autocomplete"),
        AutocompleteDropdown = require("app/ui/autocomplete_dropdown"),
        utils = require("core/utils"),
        TypeaheadDropdown = require("app/ui/typeahead/typeahead_dropdown"),
        TypeaheadInput = require("app/ui/typeahead/typeahead_input"),
        DirectMessageDialog = require("app/ui/direct_message_dialog"),
        TweetBox = require("app/ui/tweet_box"),
        hasDialog = !! $("#dm_dialog").length;
    module.exports = hasDialog ? initialize : $.noop
});
define("app/data/profile_popup", ["module", "require", "exports", "core/component", "app/data/with_data"], function(module, require, exports) {
    function profilePopupData() {
        this.defaultAttrs({
            noShowError: !0
        }), this.userCache = {
            screenNames: Object.create(null),
            ids: Object.create(null)
        }, this.socialProofCache = {
            screenNames: Object.create(null),
            ids: Object.create(null)
        }, this.saveToCache = function(a, b) {
            a.ids[b.user_id] = b, a.screenNames[b.screen_name] = b
        }, this.retrieveFromCache = function(a, b) {
            var c;
            return b.userId ? c = a.ids[b.userId] : b.user_id ? c = a.ids[b.user_id] : b.screenName ? c = a.screenNames[b.screenName] : b.screen_name && (c = a.screenNames[b.screen_name]), c
        }, this.invalidateCaches = function(a, b) {
            var c, d, e;
            b.userId ? (c = b.userId, e = this.userCache.ids[c], d = e && e.screen_name) : (d = b.screenName, e = this.userCache.screenNames[d], c = e && e.user_id), c && delete this.userCache.ids[c], c && delete this.socialProofCache.ids[c], d && delete this.userCache.screenNames[d], d && delete this.socialProofCache.screenNames[d]
        }, this.getSocialProof = function(a, b) {
            if (!this.attr.asyncSocialProof || !this.attr.loggedIn) return;
            var c = function(a) {
                this.saveToCache(this.socialProofCache, a), this.trigger("dataSocialProofSuccess", a)
            }.bind(this),
                d = function(a) {
                    this.trigger("dataSocialProofFailure", a)
                }.bind(this),
                e = this.retrieveFromCache(this.socialProofCache, a);
            if (e) {
                e.sourceEventData = a, c(e);
                return
            }
            this.get({
                url: "/i/profiles/social_proof",
                data: b,
                eventData: a,
                cache: !1,
                success: c,
                error: d
            })
        }, this.getProfilePopupMain = function(a, b) {
            var c = function(a) {
                this.saveToCache(this.userCache, a), this.trigger("dataProfilePopupSuccess", a);
                var b = this.retrieveFromCache(this.socialProofCache, a);
                b && this.trigger("dataSocialProofSuccess", b)
            }.bind(this),
                d = function(a) {
                    this.trigger("dataProfilePopupFailure", a)
                }.bind(this),
                e = this.retrieveFromCache(this.userCache, a);
            if (e) {
                e.sourceEventData = a, c(e);
                return
            }
            this.get({
                url: "/i/profiles/popup",
                data: b,
                eventData: a,
                cache: !1,
                success: c,
                error: d
            })
        }, this.getProfilePopup = function(a, b) {
            var c = {};
            b.screenName ? c.screen_name = b.screenName : b.userId && (c.user_id = b.userId), this.attr.asyncSocialProof && (c.async_social_proof = !0), this.getSocialProof(b, c), this.getProfilePopupMain(b, c)
        }, this.after("initialize", function() {
            this.on("uiWantsProfilePopup", this.getProfilePopup), this.on(document, "dataFollowStateChange dataUserActionSuccess", this.invalidateCaches)
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data"),
        ProfilePopupData = defineComponent(profilePopupData, withData);
    module.exports = ProfilePopupData
});
define("app/data/profile_popup_scribe", ["module", "require", "exports", "core/component", "app/data/with_interaction_data_scribe", "core/utils", "app/data/client_event"], function(module, require, exports) {
    function profilePopupScribe() {
        this.scribeProfilePopupOpen = function(a, b) {
            if (this.clientEvent.scribeContext.page != "profile" || !this.clientEvent.scribeData.profile_id) this.clientEvent.scribeData.profile_id = b.user_id;
            this.scribe({
                component: "profile_dialog",
                action: "open"
            })
        }, this.cleanupProfilePopupScribing = function(a, b) {
            this.clientEvent.scribeData.profile_id && this.clientEvent.scribeContext.page != "profile" && delete this.clientEvent.scribeData.profile_id
        }, this.after("initialize", function() {
            this.clientEvent = clientEvent, this.on(document, "dataProfilePopupSuccess", this.scribeProfilePopupOpen), this.on(document, "uiCloseProfilePopup", this.cleanupProfilePopupScribing)
        })
    }
    var defineComponent = require("core/component"),
        withInteractionDataScribe = require("app/data/with_interaction_data_scribe"),
        utils = require("core/utils"),
        clientEvent = require("app/data/client_event");
    module.exports = defineComponent(profilePopupScribe, withInteractionDataScribe)
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
define("app/ui/with_profile_stats", ["module", "require", "exports", "core/compose"], function(module, require, exports) {
    function withProfileStats() {
        this.defaultAttrs({}), this.updateProfileStats = function(a, b) {
            if (!b.stats || !b.stats.length) return;
            $.each(b.stats, function(a, b) {
                this.$node.find(this.statSelector(b.user_id, b.stat)).html(b.html)
            }.bind(this))
        }, this.statSelector = function(a, b) {
            return '.stats[data-user-id="' + a + '"] a[data-element-term="' + b + '_stats"]'
        }, this.after("initialize", function(a) {
            this.on(document, "dataGotProfileStats", this.updateProfileStats)
        })
    }
    var compose = require("core/compose");
    module.exports = withProfileStats
});
define("app/ui/with_handle_overflow", ["module", "require", "exports"], function(module, require, exports) {
    function withHandleOverflow() {
        this.defaultAttrs({
            heightOverflowClassName: "height-overflow"
        }), this.checkForOverflow = function(a) {
            a = a || this.$node;
            if (!a || !a.length) return;
            a[0].scrollHeight > a.height() ? a.addClass(this.attr.heightOverflowClassName) : a.removeClass(this.attr.heightOverflowClassName)
        }
    }
    module.exports = withHandleOverflow
});
define("app/ui/profile_popup", ["module", "require", "exports", "core/component", "app/ui/with_dialog", "app/ui/with_position", "app/ui/with_user_actions", "app/ui/with_item_actions", "app/ui/with_profile_stats", "app/ui/with_handle_overflow"], function(module, require, exports) {
    function profilePopup() {
        this.defaultAttrs({
            modalSelector: ".modal",
            dialogContentSelector: ".profile-modal",
            profileHeaderInnerSelector: ".profile-header-inner",
            socialProofSelector: ".social-proof",
            tweetSelector: ".simple-tweet",
            slideDuration: 100,
            top: 47,
            bottom: 10,
            tweetMinimum: 2,
            itemType: "user"
        }), this.slideInContent = function(a) {
            var b = this.$dialog.height(),
                c = $(a);
            this.addHeaderImage(c), this.$contentContainer.html(c), this.$node.addClass("has-content"), this.removeTweets();
            var d = this.$dialog.height();
            this.$dialog.height(b), this.$dialog.animate({
                height: d
            }, this.attr.slideDuration, this.slideInComplete.bind(this))
        }, this.removeTweets = function() {
            var a = this.select("tweetSelector");
            for (var b = a.length - 1; b > this.attr.tweetMinimum - 1; b--) {
                if (!this.isTooTall()) return;
                a.eq(b).remove()
            }
        }, this.getWindowHeight = function() {
            return $(window).height()
        }, this.isTooTall = function() {
            return this.$dialog.height() + this.attr.top + this.attr.bottom > this.getWindowHeight()
        }, this.addHeaderImage = function(a) {
            var b = a.find(this.attr.profileHeaderInnerSelector);
            b.css("background-image", b.attr("data-background-image"))
        }, this.slideInComplete = function() {
            this.checkForOverflow(this.select("profileHeaderInnerSelector"))
        }, this.clearPopup = function() {
            this.$dialog.height("auto"), this.$contentContainer.empty()
        }, this.openProfilePopup = function(a, b) {
            b.screenName && delete b.userId;
            if (b.userId && b.userId === this.currentUserId() || b.screenName && b.screenName === this.currentScreenName()) return;
            this.open(), this.clearPopup(), this.$node.removeClass("has-content"), this.$node.attr("data-associated-tweet-id", b.tweetId || null), this.$node.attr("data-impression-id", b.impressionId || null), this.$node.attr("data-disclosure-type", b.disclosureType || null), this.$node.attr("data-impression-cookie", b.impressionCookie || null), this.trigger("uiWantsProfilePopup", b)
        }, this.closeProfilePopup = function(a) {
            this.clearPopup(), this.trigger("uiCloseProfilePopup", {
                userId: this.currentUserId(),
                screenName: this.currentScreenName()
            })
        }, this.fillProfile = function(a, b) {
            this.$node.attr("data-screen-name", b.screen_name || null), this.$node.attr("data-user-id", b.user_id || null), this.slideInContent(b.html)
        }, this.removeSocialProof = function(a, b) {
            this.select("socialProofSelector").remove()
        }, this.addSocialProof = function(a, b) {
            b.html ? this.select("socialProofSelector").html(b.html) : this.removeSocialProof()
        }, this.showError = function(a, b) {
            var c = ['<div class="profile-modal-header error"><p>', b.message, "</p></div>"].join("");
            this.slideInContent(c)
        }, this.getPopupData = function(a) {
            return !this.isOpen() || !this.$node.hasClass("has-content") ? null : this.$node.attr(a)
        }, this.currentScreenName = function() {
            return this.getPopupData("data-screen-name")
        }, this.currentUserId = function() {
            return this.getPopupData("data-user-id")
        }, this.after("initialize", function() {
            this.$contentContainer = this.select("dialogContentSelector"), this.on(document, "uiShowProfilePopup", this.openProfilePopup), this.on(document, "dataProfilePopupSuccess", this.fillProfile), this.on(document, "dataProfilePopupFailure", this.showError), this.on(document, "dataSocialProofSuccess", this.addSocialProof), this.on(document, "dataSocialProofFailure", this.removeSocialProof), this.on(document, "uiOpenConfirmDialog uiOpenTweetDialog uiOpenDMConversation uiListAction uiOpenSigninOrSignupDialog uiEmbedProfileAction", this.close), this.on("uiDialogClosed", this.closeProfilePopup)
        })
    }
    var defineComponent = require("core/component"),
        withDialog = require("app/ui/with_dialog"),
        withPosition = require("app/ui/with_position"),
        withUserActions = require("app/ui/with_user_actions"),
        withItemActions = require("app/ui/with_item_actions"),
        withProfileStats = require("app/ui/with_profile_stats"),
        withHandleOverflow = require("app/ui/with_handle_overflow"),
        ProfilePopup = defineComponent(profilePopup, withDialog, withPosition, withUserActions, withItemActions, withProfileStats, withHandleOverflow);
    module.exports = ProfilePopup
});
define("app/data/user", ["module", "require", "exports", "core/component", "core/utils", "app/data/with_data", "core/i18n"], function(module, require, exports) {
    function userData() {
        this.updateFollowStatus = function(a, b) {
            function c(c) {
                this.trigger("dataFollowStateChange", utils.merge(c, a, {
                    userId: a.userId,
                    newState: c.new_state,
                    requestUrl: b
                })), this.trigger(document, "dataGotProfileStats", {
                    stats: c.profile_stats
                })
            }
            function d(b) {
                var c = a.userId,
                    d = a.originalFollowState;
                b.new_state && (d = b.new_state), this.trigger("dataFollowStateChange", utils.merge(b, {
                    userId: c,
                    newState: d
                }))
            }
            var e = a.disclosureType ? a.disclosureType == "earned" : undefined;
            this.post({
                url: b,
                data: {
                    user_id: a.userId,
                    impression_id: a.impressionId,
                    earned: e,
                    fromShortcut: a.fromShortcut
                },
                eventData: a,
                success: c.bind(this),
                error: d.bind(this)
            })
        }, this.reversibleAjaxCall = function(a, b, c) {
            function d(c) {
                this.trigger("dataUserActionSuccess", $.extend({}, c, {
                    userId: a.userId,
                    requestUrl: b
                })), c.message && this.trigger("uiShowMessage", c)
            }
            function e(b) {
                this.trigger(c, a)
            }
            this.post({
                url: b,
                data: {
                    user_id: a.userId,
                    impression_id: a.impressionId
                },
                eventData: a,
                success: d.bind(this),
                error: e.bind(this)
            })
        }, this.normalAjaxCall = function(a, b) {
            function c(c) {
                this.trigger("dataUserActionSuccess", $.extend({}, c, {
                    userId: a.userId,
                    requestUrl: b
                })), c.message && this.trigger("uiShowMessage", c)
            }
            this.post({
                url: b,
                data: {
                    user_id: a.userId,
                    token: a.feedbackToken,
                    impression_id: a.impressionId
                },
                eventData: a,
                success: c.bind(this),
                error: "dataUserActionError"
            })
        }, this.followAction = function(a, b) {
            var c = "/i/user/follow";
            this.updateFollowStatus(b, c)
        }, this.unfollowAction = function(a, b) {
            var c = "/i/user/unfollow";
            this.updateFollowStatus(b, c)
        }, this.cancelAction = function(a, b) {
            var c = "/i/user/cancel";
            this.updateFollowStatus(b, c)
        }, this.blockAction = function(a, b) {
            var c = "/i/user/block";
            this.updateFollowStatus(b, c)
        }, this.unblockAction = function(a, b) {
            var c = "/i/user/unblock";
            this.updateFollowStatus(b, c)
        }, this.reportSpamAction = function(a, b) {
            this.normalAjaxCall(b, "/i/user/report_spam")
        }, this.hideSuggestionAction = function(a, b) {
            this.normalAjaxCall(b, "/i/user/hide")
        }, this.retweetOnAction = function(a, b) {
            this.reversibleAjaxCall(b, "/i/user/retweets_on", "dataRetweetOffAction")
        }, this.retweetOffAction = function(a, b) {
            this.reversibleAjaxCall(b, "/i/user/retweets_off", "dataRetweetOnAction")
        }, this.deviceNotificationsOnAction = function(a, b) {
            this.reversibleAjaxCall(b, "/i/user/device_notifications_on", "dataDeviceNotificationsOffAction")
        }, this.deviceNotificationsOffAction = function(a, b) {
            this.reversibleAjaxCall(b, "/i/user/device_notifications_off", "dataDeviceNotificationsOnAction")
        }, this.after("initialize", function() {
            this.on(document, "uiFollowAction", this.followAction), this.on(document, "uiUnfollowAction", this.unfollowAction), this.on(document, "uiCancelFollowRequestAction", this.cancelAction), this.on(document, "uiBlockAction", this.blockAction), this.on(document, "uiUnblockAction", this.unblockAction), this.on(document, "uiReportSpamAction", this.reportSpamAction), this.on(document, "uiHideSuggestionAction", this.hideSuggestionAction), this.on(document, "uiRetweetOnAction", this.retweetOnAction), this.on(document, "uiRetweetOffAction", this.retweetOffAction), this.on(document, "uiDeviceNotificationsOnAction", this.deviceNotificationsOnAction), this.on(document, "uiDeviceNotificationsOffAction", this.deviceNotificationsOffAction)
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        withData = require("app/data/with_data"),
        _ = require("core/i18n"),
        UserData = defineComponent(userData, withData);
    module.exports = UserData
});
define("app/data/lists", ["module", "require", "exports", "core/component", "app/data/with_data"], function(module, require, exports) {
    function listsData() {
        this.listMembershipContent = function(a, b) {
            this.get({
                url: "/i/" + b.userId + "/lists",
                dataType: "json",
                data: {},
                eventData: b,
                success: "dataGotListMembershipContent",
                error: "dataFailedToGetListMembershipContent"
            })
        }, this.addUserToList = function(a, b) {
            this.post({
                url: "/i/" + b.userId + "/lists/" + b.listId + "/members",
                dataType: "json",
                data: {},
                eventData: b,
                success: "dataDidAddUserToList",
                error: "dataFailedToAddUserToList"
            })
        }, this.removeUserFromList = function(a, b) {
            this.destroy({
                url: "/i/" + b.userId + "/lists/" + b.listId + "/members",
                dataType: "json",
                data: {},
                eventData: b,
                success: "dataDidRemoveUserFromList",
                error: "dataFailedToRemoveUserFromList"
            })
        }, this.createList = function(a, b) {
            this.post({
                url: "/i/lists/create",
                dataType: "json",
                data: b,
                eventData: b,
                success: "dataDidCreateList",
                error: "dataFailedToCreateList"
            })
        }, this.after("initialize", function() {
            this.on("uiNeedsListMembershipContent", this.listMembershipContent), this.on("uiAddUserToList", this.addUserToList), this.on("uiRemoveUserFromList", this.removeUserFromList), this.on("uiCreateList", this.createList)
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data");
    module.exports = defineComponent(listsData, withData)
});
define("app/boot/profile_popup", ["module", "require", "exports", "core/utils", "app/data/profile_popup", "app/data/profile_popup_scribe", "app/ui/profile_popup", "app/data/user", "app/data/lists"], function(module, require, exports) {
    function initialize(a) {
        ProfilePopupData.attachTo(document, utils.merge(a, {
            eventData: {
                scribeContext: {
                    component: "profile_dialog"
                }
            }
        })), UserData.attachTo(document, a), Lists.attachTo(document, a), ProfilePopup.attachTo("#profile_popup", utils.merge(a, {
            eventData: {
                scribeContext: {
                    component: "profile_dialog"
                }
            }
        })), ProfilePopupScribe.attachTo(document, a)
    }
    var utils = require("core/utils"),
        ProfilePopupData = require("app/data/profile_popup"),
        ProfilePopupScribe = require("app/data/profile_popup_scribe"),
        ProfilePopup = require("app/ui/profile_popup"),
        UserData = require("app/data/user"),
        Lists = require("app/data/lists"),
        hasPopup = $("#profile_popup").length > 0;
    module.exports = hasPopup ? initialize : $.noop
});
define("app/data/autocomplete_scribe", ["module", "require", "exports", "core/component", "app/data/with_scribe", "app/utils/scribe_item_types"], function(module, require, exports) {
    function autocompleteScribe() {
        this.scribeAutocompleteSelected = function(a, b) {
            var c = {
                message: b.partialWord,
                items: [{
                    id: b.id,
                    item_type: itemTypes.user,
                    position: b.itemIndex
                }],
                format_version: 2,
                event_info: b.src
            };
            this.scribe("select", b, c)
        }, this.after("initialize", function() {
            this.on(document, "uiSendAutocompleteData", this.scribeAutocompleteSelected)
        })
    }
    var defineComponent = require("core/component"),
        withScribe = require("app/data/with_scribe"),
        itemTypes = require("app/utils/scribe_item_types");
    module.exports = defineComponent(autocompleteScribe, withScribe)
});
define("app/data/typeahead/with_cache", ["module", "require", "exports"], function(module, require, exports) {
    function WithCache() {
        this.defaultAttrs({
            cache_limit: 10
        }), this.getCachedSuggestions = function(a) {
            return this.cache[a] ? this.cache[a].value : null
        }, this.deleteCachedSuggestions = function(a) {
            return this.cache[a] ? (this.cache.COUNT > 1 && (a == this.cache.NEWEST.query ? (this.cache.NEWEST = this.cache.NEWEST.before, this.cache.NEWEST.after = null) : a == this.cache.OLDEST.query ? (this.cache.OLDEST = this.cache.OLDEST.after, this.cache.OLDEST.before = null) : (this.cache[a].after.before = this.cache[a].before, this.cache[a].before.after = this.cache[a].after)), delete this.cache[a], this.cache.COUNT -= 1, !0) : !1
        }, this.setCachedSuggestions = function(a, b) {
            if (this.cache.LIMIT === 0) return;
            this.deleteCachedSuggestions(a), this.cache.COUNT >= this.cache.LIMIT && this.deleteCachedSuggestions(this.cache.OLDEST.query), this.cache.COUNT == 0 ? (this.cache[a] = {
                query: a,
                value: b,
                before: null,
                after: null
            }, this.cache.NEWEST = this.cache[a], this.cache.OLDEST = this.cache[a]) : (this.cache[a] = {
                query: a,
                value: b,
                before: this.cache.NEWEST,
                after: null
            }, this.cache.NEWEST.after = this.cache[a], this.cache.NEWEST = this.cache[a]), this.cache.COUNT += 1
        }, this.aroundGetSuggestions = function(a, b, c) {
            var d = c.id + ":" + c.query,
                e = this.getCachedSuggestions(d);
            if (e) {
                this.triggerSuggestionsEvent(c.id, c.query, e);
                return
            }
            a(b, c)
        }, this.afterTriggerSuggestionsEvent = function(a, b, c, d) {
            if (d) return;
            var e = a + ":" + b;
            this.setCachedSuggestions(e, c)
        }, this.after("triggerSuggestionsEvent", this.afterTriggerSuggestionsEvent), this.around("getSuggestions", this.aroundGetSuggestions), this.after("initialize", function(a) {
            this.cache = {
                NEWEST: null,
                OLDEST: null,
                COUNT: 0,
                LIMIT: this.attr.cache_limit
            }
        })
    }
    module.exports = WithCache
});
define("app/utils/typeahead_helpers", ["module", "require", "exports"], function(module, require, exports) {
    function tokenizeText(a) {
        return a.trim().toLowerCase().split(/[\s_,.-]+/)
    }
    module.exports = {
        tokenizeText: tokenizeText
    }
});
define("app/data/with_datasource_helpers", ["module", "require", "exports"], function(module, require, exports) {
    function withDatasourceHelpers() {
        this.prefetch = function(a) {
            var b = {
                prefetch: !0,
                result_type: a,
                count: this.getPrefetchCount()
            };
            b[a + "_cache_age"] = this.storage.getCacheAge(this.attr.storageHash, this.attr.ttl_ms), this.get({
                url: "/i/search/typeahead.json",
                headers: {
                    "X-Phx": !0
                },
                data: b,
                eventData: {},
                success: this.processResults.bind(this),
                error: this.useStaleData.bind(this)
            })
        }, this.useStaleData = function() {
            this.extendTTL(), this.getDataFromLocalStorage()
        }, this.extendTTL = function() {
            var a = this.getStorageKeys();
            for (var b = 0; b < a.length; b++) this.storage.updateTTL(a[b], this.attr.ttl_ms)
        }, this.loadData = function(a) {
            var b = this.getStorageKeys().some(function(a) {
                return this.storage.isExpired(a)
            }, this);
            b ? this.prefetch(a) : this.isMetadataExpired() ? this.prefetch(a) : this.getDataFromLocalStorage()
        }, this.isIE8 = function() {
            return $.browser.msie && parseInt($.browser.version, 10) === 8
        }, this.getProtocol = function() {
            return window.location.protocol
        }
    }
    module.exports = withDatasourceHelpers
});
define("app/data/typeahead/accounts_datasource", ["module", "require", "exports", "app/utils/typeahead_helpers", "app/utils/storage/custom", "app/data/with_data", "core/compose", "core/utils", "app/data/with_datasource_helpers"], function(module, require, exports) {
    function accountsDatasource(a) {
        this.attr = {
            ttl_ms: 2592e5,
            localStorageCount: 1200,
            ie8LocalStorageCount: 1e3,
            limit: 6,
            version: 4,
            localQueriesEnabled: !1,
            remoteQueriesEnabled: !1,
            onlyDMable: !1,
            storageAdjacencyList: "userAdjacencyList",
            storageHash: "userHash",
            storageProtocol: "protocol",
            storageVersion: "userVersion"
        }, this.attr = util.merge(this.attr, a), this.after = function() {}, compose.mixin(this, [withData, withDatasourceHelpers]), this.getPrefetchCount = function() {
            return this.isIE8() && this.attr.localStorageCount > this.attr.ie8LocalStorageCount ? this.attr.ie8LocalStorageCount : this.attr.localStorageCount
        }, this.isMetadataExpired = function() {
            var a = this.storage.getItem(this.attr.storageVersion),
                b = this.storage.getItem(this.attr.storageProtocol);
            return a == this.attr.version && b == this.getProtocol() ? !1 : !0
        }, this.getStorageKeys = function() {
            return [this.attr.storageVersion, this.attr.storageHash, this.attr.storageAdjacencyList, this.attr.storageProtocol]
        }, this.getDataFromLocalStorage = function() {
            this.userHash = this.storage.getItem(this.attr.storageHash) || this.userHash, this.adjacencyList = this.storage.getItem(this.attr.storageAdjacencyList) || this.adjacencyList
        }, this.processResults = function(a) {
            if (!a || !a.users) {
                this.useStaleData();
                return
            }
            a.users.forEach(function(a) {
                a.tokens = a.tokens.map(function(a) {
                    return typeof a == "string" ? a : a.token
                }), this.userHash[a.id] = a, a.tokens.forEach(function(b) {
                    var c = b.charAt(0);
                    this.adjacencyList[c] === undefined && (this.adjacencyList[c] = []), this.adjacencyList[c].indexOf(a.id) === -1 && this.adjacencyList[c].push(a.id)
                }, this)
            }, this), this.storage.setItem(this.attr.storageHash, this.userHash, this.attr.ttl_ms), this.storage.setItem(this.attr.storageAdjacencyList, this.adjacencyList, this.attr.ttl_ms), this.storage.setItem(this.attr.storageVersion, this.attr.version, this.attr.ttl_ms), this.storage.setItem(this.attr.storageProtocol, this.getProtocol(), this.attr.ttl_ms)
        }, this.getLocalSuggestions = function(a) {
            if (!this.attr.localQueriesEnabled) return [];
            var b = helpers.tokenizeText(a),
                c = this.getPotentiallyMatchingIds(b),
                d = this.getAccountsFromIds(c),
                e = d.filter(this.matcher(b));
            return e.sort(this.sorter), e = e.slice(0, this.attr.limit), e
        }, this.getPotentiallyMatchingIds = function(a) {
            var b = [];
            return a.map(function(a) {
                var c = this.adjacencyList[a.charAt(0)];
                c && (b = b.concat(c))
            }, this), b = util.uniqueArray(b), b
        }, this.getAccountsFromIds = function(a) {
            var b = [];
            return a.forEach(function(a) {
                var c = this.userHash[a];
                c && b.push(c)
            }, this), b
        }, this.matcher = function(a) {
            return function(b) {
                var c = b.tokens,
                    d = [];
                if (this.attr.onlyDMable && !b.is_dm_able) return !1;
                var e = a.every(function(a) {
                    var b = c.filter(function(b) {
                        return b.indexOf(a) === 0
                    });
                    return b.length
                });
                if (e) return b
            }.bind(this)
        }, this.sorter = function(a, b) {
            function e(a, b, c) {
                var d = a.score_boost ? a.score_boost : 0,
                    e = b.score_boost ? b.score_boost : 0,
                    f = a.rounded_score ? a.rounded_score : 0,
                    g = b.rounded_score ? b.rounded_score : 0;
                return c ? b.rounded_graph_weight + e - (a.rounded_graph_weight + d) : g + e - (f + d)
            }
            var c = a.rounded_graph_weight && a.rounded_graph_weight !== 0,
                d = b.rounded_graph_weight && b.rounded_graph_weight !== 0;
            return c && !d ? -1 : d && !c ? 1 : c && d ? e(a, b, !0) : e(a, b, !1)
        }, this.getRemoteSuggestions = function(a, b, c) {
            var d = c.accounts || [],
                e = {};
            return d.forEach(function(a) {
                e[a.id] = !0
            }, this), this.attr.remoteQueriesEnabled && b.users.forEach(function(a) {
                !e[a.id] && (!this.attr.onlyDMable || a.is_dm_able) && d.push(a)
            }, this), c.accounts = d.slice(0, this.attr.limit), c
        }, this.requiresRemoteSuggestions = function() {
            return this.attr.remoteQueriesEnabled
        }, this.initialize = function() {
            var a = customStorage({
                withExpiry: !0
            });
            this.storage = new a("typeahead"), this.adjacencyList = {}, this.userHash = {}, this.loadData("users")
        }, this.initialize()
    }
    var helpers = require("app/utils/typeahead_helpers"),
        customStorage = require("app/utils/storage/custom"),
        withData = require("app/data/with_data"),
        compose = require("core/compose"),
        util = require("core/utils"),
        withDatasourceHelpers = require("app/data/with_datasource_helpers");
    module.exports = accountsDatasource
});
define("app/data/typeahead/saved_searches_datasource", ["module", "require", "exports", "core/utils"], function(module, require, exports) {
    function savedSearchesDatasource(a) {
        this.attr = {
            items: [],
            limit: 0,
            searchPathWithQuery: "/search?src=savs&q=",
            querySource: "saved_search_click"
        }, this.attr = util.merge(this.attr, a), this.getRemoteSuggestions = function(a, b, c) {
            return c
        }, this.requiresRemoteSuggestions = function() {
            return !1
        }, this.getLocalSuggestions = function(a) {
            return a ? this.attr.limit === 0 ? [] : this.attr.items.filter(function(b) {
                return b.name.indexOf(a) == 0
            }).slice(0, this.attr.limit) : this.attr.items
        }, this.addSavedSearch = function(a) {
            if (!a || !a.query) return;
            this.attr.items.push({
                id: a.id,
                id_str: a.id_str,
                name: a.name,
                query: a.query,
                saved_search_path: this.attr.searchPathWithQuery + encodeURIComponent(a.query),
                search_query_source: this.attr.querySource
            })
        }, this.removeSavedSearch = function(a) {
            if (!a || !a.query) return;
            var b = this.attr.items;
            for (var c = 0; c < b.length; c++) if (b[c].query === a.query || b[c].name === a.query) {
                b.splice(c, 1);
                return
            }
        }
    }
    var util = require("core/utils");
    module.exports = savedSearchesDatasource
});
define("app/data/typeahead/with_external_event_listeners", ["module", "require", "exports", "app/utils/typeahead_helpers"], function(module, require, exports) {
    function WithExternalEventListeners() {
        this.defaultAttrs({
            weights: {
                CACHED_PROFILE_VISIT: 10,
                UNCACHED_PROFILE_VISIT: 75,
                FOLLOW: 100
            }
        }), this.onFollowStateChange = function(a, b) {
            if (!b.user || !b.userId) return;
            switch (b.newState) {
                case "blocked":
                    this.removeAccount(b.userId);
                    break;
                case "not-following":
                    this.removeAccount(b.userId);
                    break;
                case "following":
                    this.adjustScoreBoost(b.user, this.attr.weights.FOLLOW), this.addAccount(b.user)
            }
            this.updateLocalStorage()
        }, this.onProfileVisit = function(a, b) {
            var c = this.datasources.accounts.userHash[b.id];
            c ? this.adjustScoreBoost(c, this.attr.weights.CACHED_PROFILE_VISIT) : (this.adjustScoreBoost(b, this.attr.weights.UNCACHED_PROFILE_VISIT), this.addAccount(b)), this.updateLocalStorage()
        }, this.updateLocalStorage = function() {
            this.datasources.accounts.storage.setItem("userHash", this.datasources.accounts.userHash, this.datasources.accounts.attr.ttl), this.datasources.accounts.storage.setItem("adjacencyList", this.datasources.accounts.adjacencyList, this.datasources.accounts.attr.ttl), this.datasources.accounts.storage.setItem("version", this.datasources.accounts.attr.version, this.datasources.accounts.attr.ttl)
        }, this.removeAccount = function(a) {
            if (!this.datasources.accounts.userHash[a]) return;
            var b = this.datasources.accounts.userHash[a].tokens;
            b.forEach(function(b) {
                var c = this.datasources.accounts.adjacencyList[b.charAt(0)];
                if (!c) return;
                var d = c.indexOf(a);
                if (d === -1) return;
                c.splice(d, 1)
            }, this), delete this.datasources.accounts.userHash[a]
        }, this.adjustScoreBoost = function(a, b) {
            a.score_boost ? a.score_boost += b : a.score_boost = b
        }, this.addAccount = function(a) {
            this.datasources.accounts.userHash[a.id] = a, a.tokens = ["@" + a.screen_name, a.screen_name].concat(helpers.tokenizeText(a.name)), a.tokens.forEach(function(b) {
                var c = b.charAt(0);
                if (!this.datasources.accounts.adjacencyList[c]) {
                    this.datasources.accounts.adjacencyList[c] = [a.id];
                    return
                }
                this.datasources.accounts.adjacencyList[c].indexOf(a.id) === -1 && this.datasources.accounts.adjacencyList[c].push(a.id)
            }, this)
        }, this.addSavedSearch = function(a, b) {
            this.datasources.savedSearches.addSavedSearch(b)
        }, this.removeSavedSearch = function(a, b) {
            this.datasources.savedSearches.removeSavedSearch(b)
        }, this.setupEventListeners = function(a) {
            switch (a) {
                case "accounts":
                    this.on("dataFollowStateChange", this.onFollowStateChange.bind(this)), this.on("profileVisit", this.onProfileVisit.bind(this));
                    break;
                case "savedSearches":
                    this.on(document, "dataAddedSavedSearch", this.addSavedSearch), this.on(document, "dataRemovedSavedSearch", this.removeSavedSearch)
            }
        }
    }
    var helpers = require("app/utils/typeahead_helpers");
    module.exports = WithExternalEventListeners
});
define("app/data/typeahead/topics_datasource", ["module", "require", "exports", "app/utils/typeahead_helpers", "app/utils/storage/custom", "app/data/with_data", "core/compose", "core/utils", "app/data/with_datasource_helpers"], function(module, require, exports) {
    function topicsDatasource(a) {
        this.attr = {
            ttl_ms: 216e5,
            limit: 4,
            version: 3,
            storageAdjacencyList: "topicsAdjacencyList",
            storageHash: "topicsHash",
            storageVersion: "topicsVersion",
            prefetchLimit: 500
        }, this.attr = util.merge(this.attr, a), this.after = function() {}, compose.mixin(this, [withData, withDatasourceHelpers]), this.getStorageKeys = function() {
            return [this.attr.storageVersion, this.attr.storageHash, this.attr.storageAdjacencyList]
        }, this.getPrefetchCount = function() {
            return this.attr.prefetchLimit
        }, this.isMetadataExpired = function() {
            var a = this.storage.getItem(this.attr.storageVersion);
            return a == this.attr.version ? !1 : !0
        }, this.getDataFromLocalStorage = function() {
            this.topicsHash = this.storage.getItem(this.attr.storageHash) || this.topicsHash, this.adjacencyList = this.storage.getItem(this.attr.storageAdjacencyList) || this.adjacencyList
        }, this.processResults = function(a) {
            if (!a || !a.topics) {
                this.useStaleData();
                return
            }
            a.topics.forEach(function(a) {
                var b = a.topic;
                this.topicsHash[b] = a, a.tokens.forEach(function(a) {
                    var c = a.token.charAt(0);
                    this.adjacencyList[c] === undefined && (this.adjacencyList[c] = []), this.adjacencyList[c].indexOf(b) === -1 && this.adjacencyList[c].push(b)
                }, this)
            }, this), this.storage.setItem(this.attr.storageHash, this.topicsHash, this.attr.ttl_ms), this.storage.setItem(this.attr.storageAdjacencyList, this.adjacencyList, this.attr.ttl_ms), this.storage.setItem(this.attr.storageVersion, this.attr.version, this.attr.ttl_ms)
        }, this.getLocalSuggestions = function(a) {
            if (!this.attr.localQueriesEnabled) return [];
            var b = this.adjacencyList[a.charAt(0)] || [];
            b = this.getTopicObjectsFromStrings(b);
            var c = b.filter(function(b) {
                return b.topic.indexOf(a) === 0
            }, this);
            return c.sort(function(a, b) {
                return b.rounded_score - a.rounded_score
            }.bind(this)), c = c.slice(0, this.attr.limit), c
        }, this.getTopicObjectsFromStrings = function(a) {
            var b = [];
            return a.forEach(function(a) {
                var c = this.topicsHash[a];
                c && b.push(c)
            }, this), b
        }, this.getRemoteSuggestions = function(a, b, c) {
            var d = c.topics || [],
                e = {};
            return d.forEach(function(a) {
                e[a.topic] = !0
            }, this), b.topics.forEach(function(a) {
                e[a.topic] || d.push(a)
            }, this), c.topics = d.slice(0, this.attr.limit), c
        }, this.initialize = function() {
            var a = customStorage({
                withExpiry: !0
            });
            this.storage = new a("typeahead"), this.topicsHash = {}, this.adjacencyList = {}, this.loadData("topics")
        }, this.initialize()
    }
    var helpers = require("app/utils/typeahead_helpers"),
        customStorage = require("app/utils/storage/custom"),
        withData = require("app/data/with_data"),
        compose = require("core/compose"),
        util = require("core/utils"),
        withDatasourceHelpers = require("app/data/with_datasource_helpers");
    module.exports = topicsDatasource
});
define("app/data/typeahead/typeahead", ["module", "require", "exports", "core/component", "core/utils", "app/data/with_data", "app/data/typeahead/with_cache", "app/data/typeahead/accounts_datasource", "app/data/typeahead/saved_searches_datasource", "app/data/typeahead/with_external_event_listeners", "app/data/typeahead/topics_datasource"], function(module, require, exports) {
    function typeahead() {
        this.defaultAttrs({
            limit: 10,
            remoteDebounceInterval: 300,
            remoteThrottleInterval: 300,
            outstandingRemoteRequestCount: 0,
            queuedRequestData: !1,
            outstandingRemoteRequestMax: 6,
            useThrottle: !1
        }), this.triggerSuggestionsEvent = function(a, b, c, d) {
            this.trigger("dataTypeaheadSuggestionsResults", {
                suggestions: c,
                query: b,
                id: a
            })
        }, this.getLocalSuggestions = function(a, b) {
            var c = {};
            return b.forEach(function(b) {
                if (!this.datasources[b]) return;
                var d = this.datasources[b].getLocalSuggestions(a);
                d.length && (c[b] = d)
            }, this), c
        }, this.processRemoteSuggestions = function(a) {
            this.adjustRequestCount(-1);
            var b = a.sourceEventData,
                c = b.suggestions || {};
            b.datasources.forEach(function(d) {
                if (this.datasources[d]) {
                    var e = this.datasources[d].getRemoteSuggestions(b.query, a, c);
                    e[d] && e[d].length && (b.suggestions[d] = e[d])
                }
            }, this), this.triggerSuggestionsEvent(b.id, b.query, c, !1), this.makeQueuedRemoteRequestIfPossible()
        }, this.getRemoteSuggestions = function(a, b, c, d) {
            var e = d.some(function(a) {
                return this.datasources[a] && this.datasources[a].requiresRemoteSuggestions && this.datasources[a].requiresRemoteSuggestions(b)
            }, this);
            if (!e || !b) return;
            this.request[a] || (this.attr.useThrottle ? this.request[a] = utils.throttle(this.executeRemoteRequest.bind(this), this.attr.remoteThrottleInterval) : this.request[a] = utils.debounce(this.executeRemoteRequest.bind(this), this.attr.remoteDebounceInterval)), this.request[a](a, b, c, d)
        }, this.makeQueuedRemoteRequestIfPossible = function() {
            if (this.attr.outstandingRemoteRequestCount === this.attr.outstandingRemoteRequestMax - 1 && this.attr.queuedRequestData) {
                var a = this.attr.queuedRequestData;
                this.getRemoteSuggestions(a.id, a.query, a.suggestions, a.datasources), this.attr.queuedRequestData = !1
            }
        }, this.adjustRequestCount = function(a) {
            this.attr.outstandingRemoteRequestCount += a
        }, this.canMakeRemoteRequest = function(a) {
            return this.attr.outstandingRemoteRequestCount < this.attr.outstandingRemoteRequestMax ? !0 : (this.attr.queuedRequestData = a, !1)
        }, this.processRemoteRequestError = function() {
            this.adjustRequestCount(-1), this.makeQueuedRemoteRequestIfPossible()
        }, this.executeRemoteRequest = function(a, b, c, d) {
            var e = {
                id: a,
                query: b,
                suggestions: c,
                datasources: d
            };
            if (!this.canMakeRemoteRequest(e)) return;
            this.adjustRequestCount(1), this.get({
                url: "/i/search/typeahead.json",
                headers: {
                    "X-Phx": !0
                },
                data: {
                    q: b,
                    count: this.attr.limit
                },
                eventData: e,
                success: this.processRemoteSuggestions.bind(this),
                error: this.processRemoteRequestError.bind(this)
            })
        }, this.getSuggestions = function(a, b) {
            if (typeof b == "undefined") throw "No parameters specified";
            if (!b.datasources) throw "No datasources specified";
            if (typeof b.query == "undefined") throw "No query specified";
            if (!b.id) throw "No id specified";
            var c = this.getLocalSuggestions(b.query, b.datasources);
            this.triggerSuggestionsEvent(b.id, b.query, c, !0);
            if (b.query === "@" || b.localOnly === !0) return;
            this.getRemoteSuggestions(b.id, b.query, c, b.datasources)
        }, this.addDatasource = function(a, b, c) {
            var d = c[b] || {};
            if (!d.enabled) return;
            this.datasources[b] = new a(d), this.setupEventListeners(b)
        }, this.after("initialize", function(a) {
            this.datasources = {}, this.request = {}, this.addDatasource(accountsDatasource, "accounts", a), this.addDatasource(accountsDatasource, "dmAccounts", a), this.addDatasource(savedSearchesDatasource, "savedSearches", a), this.addDatasource(topicsDatasource, "topics", a), this.on("uiNeedsTypeaheadSuggestions", this.getSuggestions)
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        withData = require("app/data/with_data"),
        withCache = require("app/data/typeahead/with_cache"),
        accountsDatasource = require("app/data/typeahead/accounts_datasource"),
        savedSearchesDatasource = require("app/data/typeahead/saved_searches_datasource"),
        withExternalEventListeners = require("app/data/typeahead/with_external_event_listeners"),
        topicsDatasource = require("app/data/typeahead/topics_datasource");
    module.exports = defineComponent(typeahead, withData, withCache, withExternalEventListeners)
});
define("app/data/typeahead_scribe", ["module", "require", "exports", "core/component", "app/data/with_scribe", "app/utils/scribe_item_types"], function(module, require, exports) {
    function typeaheadScribe() {
        var a = {
            account: function(a) {
                var b = {
                    message: a.input,
                    items: [{
                        id: a.query,
                        item_type: itemTypes.user,
                        position: a.index
                    }],
                    format_version: 2,
                    event_info: a.isLocal ? "prefetched" : "remote"
                };
                this.scribe("profile_click", a, b)
            },
            search: function(b) {
                if (this.lastCompletion && b.query === this.lastCompletion.query) a.topics.call(this, this.lastCompletion);
                else {
                    var c = {
                        query: b.query,
                        items: [{
                            item_query: b.query,
                            item_type: itemTypes.search
                        }],
                        format_version: 2
                    };
                    this.scribe("search", b, c)
                }
            },
            topics: function(a) {
                var b = {
                    query: a.query,
                    message: a.input,
                    items: [{
                        item_query: a.query,
                        item_type: itemTypes.search,
                        position: a.index
                    }],
                    format_version: 2
                };
                this.scribe("search", a, b)
            },
            account_search: function(a) {
                this.scribe("people_search", a, {
                    query: a.input
                })
            },
            saved_search: function(a) {
                var b = {
                    query: a.query,
                    message: a.input,
                    items: [{
                        item_query: a.query,
                        item_type: itemTypes.savedSearch,
                        position: a.index
                    }],
                    format_version: 2
                };
                this.scribe("search", a, b)
            }
        };
        this.storeCompletionData = function(a, b) {
            b.scribeNow ? this.scribeSelection(a, b) : this.lastCompletion = b
        }, this.scribeSelection = function(b, c) {
            a[c.source] && a[c.source].call(this, c)
        }, this.after("initialize", function() {
            this.on("uiTypeaheadItemComplete", this.storeCompletionData), this.on("uiTypeaheadItemSelected uiSearchQuery", this.scribeSelection)
        })
    }
    var defineComponent = require("core/component"),
        withScribe = require("app/data/with_scribe"),
        itemTypes = require("app/utils/scribe_item_types");
    module.exports = defineComponent(typeaheadScribe, withScribe)
});
define("app/ui/dialogs/goto_user_dialog", ["module", "require", "exports", "core/utils", "app/ui/autocomplete_dropdown", "app/data/autocomplete", "core/component", "app/ui/typeahead/typeahead_dropdown", "app/ui/typeahead/typeahead_input", "app/ui/with_position", "app/ui/with_dialog"], function(module, require, exports) {
    function gotoUserDialog() {
        this.defaultAttrs({
            dropdownId: "swift_autocomplete_dropdown_goto_user",
            inputSelector: "input.username-input",
            usernameFormSelector: "form.goto-user-form",
            autoCompleteSelector: ".autocomplete-results"
        }), this.focus = function() {
            this.select("inputSelector").focus()
        }, this.gotoUser = function(a, b) {
            if (b && b.dropdownId && b.dropdownId != this.attr.dropdownId) return;
            a.preventDefault();
            if (b && b.item) {
                this.select("inputSelector").val(b.item.screen_name), this.trigger("uiNavigate", {
                    href: b.href
                });
                return
            }
            var c = this.select("inputSelector").val().trim();
            c.substr(0, 1) == "@" && (c = c.substr(1)), this.trigger("uiNavigate", {
                href: "/" + c
            })
        }, this.reset = function() {
            this.select("inputSelector").val(""), this.select("inputSelector").blur(), this.trigger(this.select("inputSelector"), "uiHideAutocomplete")
        }, this.after("initialize", function() {
            this.on(document, "uiShortcutShowGotoUser", this.open), this.on(document, "uiSendAutocompleteData", this.gotoUser), this.on("uiDialogOpened", this.focus), this.on("uiDialogClosed", this.reset), this.on(this.select("usernameFormSelector"), "submit", this.gotoUser), this.on("uiTypeaheadItemSelected uiTypeaheadSubmitQuery", this.gotoUser), this.attr.useTypeaheadEverywhere ? (this.attr.autoCompleteSelector = ".dropdown-menu.typeahead", TypeaheadInput.attachTo(this.$node, {
                inputSelector: this.attr.inputSelector,
                autocompleteAccounts: !1
            }), TypeaheadDropdown.attachTo(this.$node, {
                inputSelector: this.attr.inputSelector,
                datasources: ["accounts"],
                deciders: this.attr.typeaheadData,
                eventData: {
                    scribeContext: {
                        component: "goto_user_dialog"
                    }
                }
            })) : (AutocompleteDropdown.attachTo(this.$node, {
                dropdownId: this.attr.dropdownId,
                autocompleteInputSelector: this.select("inputSelector"),
                autocompleteUseLocalTypeahead: this.attr.autocompleteUseLocalTypeahead,
                autocompleteUseTypeahead: this.attr.autocompleteUseTypeahead,
                typeaheadInterestingWordRegexp: /^[^\s]+/,
                eventData: {
                    scribeContext: {
                        component: "goto_user_dialog"
                    }
                }
            }), Autocomplete.attachTo(this.$node, {
                triggerToken: ""
            }))
        })
    }
    var utils = require("core/utils"),
        AutocompleteDropdown = require("app/ui/autocomplete_dropdown"),
        Autocomplete = require("app/data/autocomplete"),
        defineComponent = require("core/component"),
        TypeaheadDropdown = require("app/ui/typeahead/typeahead_dropdown"),
        TypeaheadInput = require("app/ui/typeahead/typeahead_input"),
        withPosition = require("app/ui/with_position"),
        withDialog = require("app/ui/with_dialog"),
        GotoUserDialog = defineComponent(gotoUserDialog, withDialog, withPosition);
    module.exports = GotoUserDialog
});
define("app/utils/setup_polling_with_backoff", ["module", "require", "exports", "core/clock", "core/utils"], function(module, require, exports) {
    function setupPollingWithBackoff(a, b, c) {
        var d = {
            focusedInterval: 3e4,
            blurredInterval: 9e4,
            backoffFactor: 2
        };
        c = utils.merge(d, c);
        var e = clock.setIntervalEvent(a, c.focusedInterval, c.eventData);
        return b = b || $(window), b.on("focus", e.cancelBackoff.bind(e)).on("blur", e.backoff.bind(e, c.blurredInterval, c.backoffFactor)), e
    }
    var clock = require("core/clock"),
        utils = require("core/utils");
    module.exports = setupPollingWithBackoff
});
define("app/ui/page_title", ["module", "require", "exports", "core/component"], function(module, require, exports) {
    function pageTitle() {
        this.addCount = function(a, b) {
            b.count && (document.title = "(" + b.count + ") " + this.title)
        }, this.removeCount = function(a, b) {
            document.title = this.title
        }, this.setTitle = function(a, b) {
            var c = b || a.originalEvent.state;
            c && (document.title = this.title = c.title)
        }, this.after("initialize", function() {
            this.title = document.title, this.on("uiAddPageCount", this.addCount), this.on("uiHasInjectedNewTimeline", this.removeCount), this.on(document, "uiBeforePageChanged", this.setTitle)
        })
    }
    var defineComponent = require("core/component"),
        PageTitle = defineComponent(pageTitle);
    module.exports = PageTitle
});
define("app/ui/feedback/with_feedback_tweet", ["module", "require", "exports", "core/compose", "app/ui/dialogs/with_modal_tweet"], function(module, require, exports) {
    function withFeedbackTweet() {
        compose.mixin(this, [withModalTweet]), this.defaultAttrs({
            tweetItemSelector: "div.tweet",
            streamSelector: "div.stream-container"
        }), this.insertTweetIntoDialog = function() {
            if (this.selectedKey.indexOf("stream_status_") == -1) return;
            var a = this.attr.tweetItemSelector + '[data-feedback-key="' + this.selectedKey + '"]',
                b = $(this.attr.streamSelector).find(a);
            this.addTweet(b.clone().removeClass("retweeted favorited"))
        }, this.after("initialize", function() {
            this.on(document, "uiInsertElementIntoFeedbackDialog", this.insertTweetIntoDialog)
        })
    }
    var compose = require("core/compose"),
        withModalTweet = require("app/ui/dialogs/with_modal_tweet");
    module.exports = withFeedbackTweet
});
define("app/ui/feedback/feedback_stories", ["module", "require", "exports", "core/component"], function(module, require, exports) {
    function feedbackStories() {
        this.defaultAttrs({
            debugStringToggle: ".toggle-debug",
            debugStringSelector: ".debug-string",
            storyDataSelector: ".story-data"
        }), this.toggleDebugData = function(a) {
            this.select("storyDataSelector").toggleClass("expanded")
        }, this.convertDebugToHTML = function() {
            var a = this.select("debugStringSelector").text(),
                b = a.replace(/\n/g, "<br>");
            this.select("debugStringSelector").html(b)
        }, this.after("initialize", function() {
            this.convertDebugToHTML(), this.on("click", {
                debugStringToggle: this.toggleDebugData
            })
        })
    }
    var defineComponent = require("core/component");
    module.exports = defineComponent(feedbackStories)
});
define("app/ui/feedback/with_feedback_discover", ["module", "require", "exports", "app/ui/feedback/feedback_stories"], function(module, require, exports) {
    function withFeedbackDiscover() {
        this.defaultAttrs({
            storyItemSelector: "div.tweet",
            storyStreamSelector: "div.stream-container",
            debugStorySelector: ".debug-story.expanded",
            inlinedStorySelector: ".debug-story.inlined"
        }), this.insertStoryIntoDialog = function() {
            if (this.selectedKey.indexOf("story_status_") == -1) return;
            var a = this.attr.storyItemSelector + '[data-feedback-key="' + this.selectedKey + '"]',
                b = $(this.attr.storyStreamSelector).find(a);
            this.select("debugStorySelector").append(b.clone().removeClass("retweeted favorited"))
        }, this.insertFeedbackStories = function() {
            if (this.selectedKey != "discover_stories_debug") return;
            var a = $(this.attr.storyStreamSelector).find(this.attr.storyItemSelector),
                b = this.select("contentContainerSelector");
            b.empty(), a.each(function(a, c) {
                var d = $(c).data("feedback-key");
                this.debugData[d] && this.debugData[d].forEach(function(a) {
                    b.append(a.html)
                })
            }.bind(this)), this.select("inlinedStorySelector").show(), FeedbackStories.attachTo(this.attr.inlinedStorySelector)
        }, this.after("initialize", function() {
            this.on(document, "uiInsertElementIntoFeedbackDialog", this.insertStoryIntoDialog), this.on(document, "uiInsertElementIntoFeedbackDialog", this.insertFeedbackStories)
        })
    }
    var FeedbackStories = require("app/ui/feedback/feedback_stories");
    module.exports = withFeedbackDiscover
});
define("app/ui/feedback/feedback_dialog", ["module", "require", "exports", "core/component", "app/utils/cookie", "app/ui/with_position", "app/ui/with_dialog", "app/ui/feedback/with_feedback_tweet", "app/ui/feedback/with_feedback_discover", "core/i18n"], function(module, require, exports) {
    function feedbackDialog() {
        this.defaultAttrs({
            contentContainerSelector: ".sample-content",
            debugContainerSelector: ".modal-inner.debug",
            cancelSelector: ".cancel",
            reportLinkSelector: ".report-link",
            spinnerSelector: ".loading-spinner",
            pastedContentSelector: ".feedback-json-output",
            selectPasteSelector: "#select-paste-text",
            formSelector: "form",
            navBarSelector: ".nav-tabs",
            navBarTabSelector: ".nav-tabs li:not(.tab-disabled):not(.active)",
            debugKeySelectorSelector: "select[name=debug-key]",
            summaryInputSelector: "input[name=summary]",
            descriptionInputSelector: "textarea[name=comments]",
            screenshotInputSelector: "input[name=includeScreenshot]",
            screenshotPreviewLink: "#feedback-preview-screenshot",
            summaryErrorSelector: ".summary-error",
            descriptionErrorSelector: ".description-error",
            lastTabCookie: "last_feedback_tab",
            reportEmail: null,
            reportScreenshotProxyUrl: null,
            debugDataText: "",
            debugDataKey: "",
            feedbackSuccessText: "",
            dialogToggleSelector: ".feedback-dialog .feedback-data-toggle"
        }), this.takeScreenshot = function() {
            using("$lib/html2canvas.js", function() {
                var a = function(a) {
                    this.imageCanvas || (this.imageCanvas = a, this.select("screenshotPreviewLink").attr("href", this.imageCanvas.toDataURL()), this.trigger("uiNeedsFeedbackData"))
                };
                html2canvas($("body"), {
                    proxy: null,
                    onrendered: a.bind(this),
                    timeout: 1e3
                })
            }.bind(this))
        }, this.setErrorState = function(a, b) {
            b ? this.select(a).show() : this.select(a).hide()
        }, this.resetParams = function(a) {
            this.selectedKey = this.debugKey, this.selectedProject = this.projectKey, this.debugKey = null, this.projectKey = null, this.debugData = a
        }, this.toggleDebugEnabled = function(a, b) {
            this.trigger("uiToggleDebugFeedback", {
                enabled: $(b.el).is(".off")
            })
        }, this.prepareDialog = function(a, b) {
            this.debugKey = b.debugKey, this.projectKey = b.projectKey, this.imageCanvas = null, this.takeScreenshot()
        }, this.openDialog = function(a, b) {
            this.showTabFromName(cookie(this.attr.lastTabCookie) || "report");
            var c = "";
            this.debugKey && b[this.debugKey] && b[this.debugKey].length > 0 && b[this.debugKey].forEach(function(a) {
                a.html && (c += a.html)
            }), this.select("contentContainerSelector").html(c), this.select("screenshotInputSelector").attr("checked", !0), this.select("reportLinkSelector").find("button").removeClass("disabled"), this.select("spinnerSelector").css("visibility", "hidden"), this.trigger("uiCheckFeedbackBackendAvailable"), this.resetParams(b), this.resetErrorStatus(), this.selectedKey && this.trigger("uiInsertElementIntoFeedbackDialog"), this.refreshAvailableDataKeys(), this.reportToConsole(b), this.open()
        }, this.showTabFromName = function(a) {
            this.select("navBarSelector").find("li").removeClass("active"), this.select("navBarSelector").find("li[data-tab-name=" + a + "]").addClass("active"), this.$node.find(".modal-inner").hide(), this.$node.find(".modal-inner." + a).show(), cookie(this.attr.lastTabCookie, a)
        }, this.refreshAvailableDataKeys = function() {
            var a = this.select("debugKeySelectorSelector");
            a.empty();
            var b = this.selectedKey;
            Object.keys(this.debugData).forEach(function(c) {
                var d = $("<option>" + c + "</option>");
                b == c && (d = $("<option value=" + c + ">" + c + " (selected)</option>")), a.append(d)
            }), a.val(this.selectedKey), this.refreshDebugJSON()
        }, this.refreshDebugJSON = function(a) {
            var b = this.select("debugKeySelectorSelector").val() || this.selectedKey;
            if (!b || !this.debugData[b]) return;
            var c = this.debugData[b].map(function(a) {
                return a.data
            });
            this.select("pastedContentSelector").html(JSON.stringify(c, undefined, 2))
        }, this.resetErrorStatus = function() {
            this.setErrorState("summaryErrorSelector", !1), this.setErrorState("descriptionErrorSelector", !1)
        }, this.reportToConsole = function(a) {
            if (!window.console || !Object.keys(a).length) return;
            console.log && console.log(this.attr.debugDataText), console.dir && console.dir(this.debugData)
        }, this.reportFeedback = function(a, b) {
            a.preventDefault(), this.resetErrorStatus();
            var c = {};
            this.select("formSelector").serializeArray().map(function(a) {
                c[a.name] && $.isArray(c[a.name]) ? c[a.name].push(a.value) : c[a.name] ? c[a.name] = [c[a.name], a.value] : c[a.name] = a.value
            });
            var d = this.select("summaryInputSelector").val(),
                e = this.select("descriptionInputSelector").val();
            if (!d || !e) {
                d || this.setErrorState("summaryErrorSelector", !0), e || this.setErrorState("descriptionErrorSelector", !0);
                return
            }
            this.imageCanvas && c.includeScreenshot && (c.screenshotData = this.imageCanvas.toDataURL()), this.selectedProject && (c.project = this.selectedProject), this.selectedKey && (c.key = this.selectedKey), $.isEmptyObject(this.debugData) || (c.debug_text = JSON.stringify(this.debugData, undefined, 2), this.debugData.initial_pageload && (basicData = this.debugData.initial_pageload[0].data, c.basic_info = "Screen Name: " + basicData.screen_name + "\n" + "URL: " + basicData.url + "\n" + "User Agent: " + basicData.userAgent)), this.select("reportLinkSelector").find("button").addClass("disabled"), this.select("spinnerSelector").css("visibility", "visible"), this.trigger("uiFeedbackBackendPost", c)
        }, this.handleBackendSuccess = function(a, b) {
            this.close(), this.select("formSelector")[0].reset(), this.trigger("uiShowError", {
                message: _('Successfully created Jira ticket: {{ticketId}}', {
                    ticketId: "<a target='_blank' href='" + b.link + "'>" + b.ticketId + "</a>"
                })
            })
        }, this.triggerEmail = function(a, b) {
            this.close(), this.select("formSelector")[0].reset(), window.open(b.link, "_blank"), this.trigger("uiShowError", {
                message: _('Failed to create Jira ticket. Please see the popup to send an email instead.')
            })
        }, this.switchTab = function(a, b) {
            a.preventDefault(), this.showTabFromName($(a.target).closest("li").data("tab-name"))
        }, this.selectText = function(a, b) {
            this.select("debugContainerSelector").find("textarea")[0].select()
        }, this.after("initialize", function() {
            this.on(document, "dataFeedback", this.openDialog), this.on(document, "dataFeedbackBackendSuccess", this.handleBackendSuccess), this.on(document, "dataFeedbackBackendFailure", this.triggerEmail), this.on(document, "uiPrepareFeedbackDialog", this.prepareDialog), this.on("change", {
                debugKeySelectorSelector: this.refreshDebugJSON
            }), this.on("click", {
                dialogToggleSelector: this.toggleDebugEnabled,
                navBarTabSelector: this.switchTab,
                cancelSelector: this.close,
                reportLinkSelector: this.reportFeedback,
                selectPasteSelector: this.selectText
            })
        })
    }
    var defineComponent = require("core/component"),
        cookie = require("app/utils/cookie"),
        withPosition = require("app/ui/with_position"),
        withDialog = require("app/ui/with_dialog"),
        withFeedbackTweet = require("app/ui/feedback/with_feedback_tweet"),
        withFeedbackDiscover = require("app/ui/feedback/with_feedback_discover"),
        _ = require("core/i18n");
    module.exports = defineComponent(feedbackDialog, withDialog, withPosition, withFeedbackTweet, withFeedbackDiscover)
});
define("app/ui/feedback/feedback_report_link_handler", ["module", "require", "exports", "core/component"], function(module, require, exports) {
    function feedbackReportLinkHandler() {
        this.defaultAttrs({
            reportElementLinkSelector: "a[data-feedback-key]"
        }), this.openDialog = function(a, b) {
            a.preventDefault();
            var c = $(b.el);
            b = {}, b.debugKey = c.data("feedback-key"), b.projectKey = c.data("team-key"), this.trigger("uiPrepareFeedbackDialog", b)
        }, this.after("initialize", function() {
            this.on(document, "click", {
                reportElementLinkSelector: this.openDialog
            })
        })
    }
    var defineComponent = require("core/component");
    module.exports = defineComponent(feedbackReportLinkHandler)
});
define("app/data/feedback/feedback", ["module", "require", "exports", "core/component", "app/utils/cookie", "core/utils", "app/data/with_data"], function(module, require, exports) {
    function feedbackData() {
        var a = !0;
        this.defaultAttrs({
            feedbackCookie: "debug_data",
            data: {},
            reportEmail: undefined,
            reportBackendPingUrl: undefined,
            reportBackendPostUrl: undefined,
            reportBackendGetUrl: undefined
        }), this.isBackendAvailable = function() {
            return a
        }, this.getFeedbackData = function(a, b) {
            this.trigger("dataFeedback", this.attr.data)
        }, this.toggleFeedbackCookie = function(a, b) {
            var c = b.enabled ? !0 : null;
            cookie(this.attr.feedbackCookie, c), this.refreshPage(), this.checkDebugEnabled()
        }, this.refreshPage = function() {
            document.location.reload(!0)
        }, this.checkDebugEnabled = function() {
            this.trigger("dataDebugFeedbackChanged", {
                enabled: !! cookie(this.attr.feedbackCookie)
            })
        }, this.addFeedbackData = function(a, b) {
            var c = this.attr.data;
            for (var d in b) c[d] ? c[d] = [].concat.apply(c[d], b[d]) : c[d] = b[d]
        }, this.pingBackend = function(b, c) {
            if (this.attr.reportBackendPingUrl == null) {
                a = !1;
                return
            }
            var d = function(b) {
                a = !0
            }, e = function(b) {
                a = !1
            };
            this.get({
                url: this.attr.reportBackendPingUrl,
                success: d.bind(this),
                error: e.bind(this)
            })
        }, this.backendPost = function(b, c) {
            if (!this.isBackendAvailable()) {
                this.fallbackToEmail(b, c);
                return
            }
            var d = function(a) {
                var b = this.attr.reportBackendGetUrl + a.key;
                this.trigger("dataFeedbackBackendSuccess", {
                    link: b,
                    ticketId: a.key
                })
            }, e = function(d) {
                a = !1, this.fallbackToEmail(b, c)
            };
            this.post({
                url: this.attr.reportBackendPostUrl,
                data: c,
                isMutation: !1,
                success: d.bind(this),
                error: e.bind(this)
            })
        }, this.fallbackToEmail = function(a, b) {
            var c = "mailto:" + this.attr.reportEmail + "?subject=" + b.summary + "&body=",
                d = ["summary", "debug_data", "debug_text", "screenshotData"];
            for (var e in b) d.indexOf(e) < 0 && (c += e.toString() + ": " + b[e].toString() + "%0D%0A");
            this.trigger("dataFeedbackBackendFailure", {
                link: c,
                data: b
            })
        }, this.logNavigation = function(a, b) {
            this.trigger("dataSetDebugData", {
                pushState: [{
                    data: {
                        href: b.href,
                        module: b.module,
                        title: b.title
                    }
                }]
            })
        }, this.after("initialize", function(a) {
            this.data = a.data || {}, this.on("uiNeedsFeedbackData", this.getFeedbackData), this.on("uiToggleDebugFeedback", this.toggleFeedbackCookie), this.on("dataSetDebugData", this.addFeedbackData), this.on("uiCheckFeedbackBackendAvailable", this.pingBackend), this.on("uiFeedbackBackendPost", this.backendPost), this.on("uiPageChanged", this.logNavigation), this.checkDebugEnabled()
        })
    }
    var defineComponent = require("core/component"),
        cookie = require("app/utils/cookie"),
        utils = require("core/utils"),
        withData = require("app/data/with_data");
    module.exports = defineComponent(feedbackData, withData)
});
define("app/ui/search_query_source", ["module", "require", "exports", "core/component", "app/utils/storage/custom"], function(module, require, exports) {
    function searchQuerySource() {
        this.defaultAttrs({
            querySourceLinkSelector: "a[data-query-source]",
            querySourceDataAttr: "data-query-source",
            storageExpiration: 6e4
        }), this.saveQuerySource = function(a) {
            this.storage.setItem("source", {
                source: {
                    value: a,
                    expire: Date.now() + this.attr.storageExpiration
                }
            }, this.attr.storageExpiration)
        }, this.catchLinkClick = function(a, b) {
            var c = $(b.el).attr(this.attr.querySourceDataAttr);
            c && this.saveQuerySource(c)
        }, this.saveTypedQuery = function(a, b) {
            if (b.source !== "search") return;
            this.saveQuerySource("typed_query")
        }, this.after("initialize", function() {
            var a = customStorage({
                withExpiry: !0
            });
            this.storage = new a("searchQuerySource"), this.on("click", {
                querySourceLinkSelector: this.catchLinkClick
            }), this.on("uiSearchQuery", this.saveTypedQuery)
        })
    }
    var defineComponent = require("core/component"),
        customStorage = require("app/utils/storage/custom");
    module.exports = defineComponent(searchQuerySource)
});
define("app/ui/banners/email_banner", ["module", "require", "exports", "core/component"], function(module, require, exports) {
    function emailBanner() {
        this.defaultAttrs({
            resendConfirmationEmailLinkSelector: ".resend-confirmation-email-link",
            resetBounceLinkSelector: ".reset-bounce-link"
        }), this.resendConfirmationEmail = function() {
            this.trigger("uiResendConfirmationEmail")
        }, this.resetBounceLink = function() {
            this.trigger("uiResetBounceLink")
        }, this.after("initialize", function() {
            this.on("click", {
                resendConfirmationEmailLinkSelector: this.resendConfirmationEmail,
                resetBounceLinkSelector: this.resetBounceLink
            })
        })
    }
    var defineComponent = require("core/component");
    module.exports = defineComponent(emailBanner)
});
define("app/data/email_banner", ["module", "require", "exports", "core/component", "app/data/with_data", "core/i18n"], function(module, require, exports) {
    function emailBannerData() {
        this.resendConfirmationEmail = function() {
            var a = function(a) {
                this.trigger("uiShowMessage", {
                    message: a.messageForFlash
                })
            }, b = function() {
                this.trigger("uiShowMessage", {
                    message: _('Oops!  There was an error sending the confirmation email.')
                })
            };
            this.post({
                url: "/account/resend_confirmation_email",
                eventData: null,
                data: null,
                success: a.bind(this),
                error: b.bind(this)
            })
        }, this.resetBounceScore = function() {
            var a = function() {
                this.trigger("uiShowMessage", {
                    message: _('Your email notifications should resume shortly.')
                })
            }, b = function() {
                this.trigger("uiShowMessage", {
                    message: _('Oops! There was an error sending email notifications.')
                })
            };
            this.post({
                url: "/bouncers/reset",
                eventData: null,
                data: null,
                success: a.bind(this),
                error: b.bind(this)
            })
        }, this.after("initialize", function() {
            this.on("uiResendConfirmationEmail", this.resendConfirmationEmail), this.on("uiResetBounceLink", this.resetBounceScore)
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data"),
        _ = require("core/i18n");
    module.exports = defineComponent(emailBannerData, withData)
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
define("app/utils/image/image_loader", ["module", "require", "exports"], function(module, require, exports) {
    var imageLoader = {
        load: function(a, b, c) {
            var d = $("<img/>");
            d.on("load", function(a) {
                b(d)
            }), d.on("error", function(a) {
                c()
            }), d.attr("src", a)
        }
    };
    module.exports = imageLoader
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
define("app/ui/gallery/gallery", ["module", "require", "exports", "core/component", "core/utils", "core/i18n", "app/ui/media/with_legacy_media", "app/utils/image/image_loader", "app/ui/with_scrollbar_width", "app/ui/with_item_actions", "app/ui/with_tweet_actions", "app/ui/media/with_flag_action"], function(module, require, exports) {
    function gallery() {
        this.tweetHtml = {}, this.defaultAttrs({
            profileUser: !1,
            defaultGalleryTitle: _('Media Gallery'),
            mediaSelector: ".media-thumbnail",
            galleryMediaSelector: ".gallery-media",
            galleryTweetSelector: ".gallery-tweet",
            closeSelector: ".close-action, .gallery-close-target",
            gridSelector: ".grid-action",
            gallerySelector: ".swift-media-gallery",
            galleryTitleSelector: ".modal-title",
            imageSelector: ".media-image",
            navSelector: ".gallery-nav",
            prevSelector: ".nav-prev",
            nextSelector: ".nav-next",
            itemType: "tweet"
        }), this.resetMinSize = function() {
            this.galW = MINWIDTH, this.galH = MINHEIGHT;
            var a = this.select("gallerySelector");
            a.width(this.galW), a.height(this.galH)
        }, this.isOpen = function() {
            return this.$node.is(":visible")
        }, this.open = function(a, b) {
            this.calculateScrollbarWidth(), this.fromGrid = b && !! b.fromGrid, this.title = b && b.title ? b.title : this.attr.defaultGalleryTitle, this.select("galleryTitleSelector").text(this.title), b && b.showGrid && b.profileUser ? (this.select("gallerySelector").removeClass("no-grid"), this.select("gridSelector").attr("href", "/" + b.profileUser.screen_name + "/media/grid"), this.select("gridSelector").addClass("js-nav")) : (this.select("gallerySelector").addClass("no-grid"), this.select("gridSelector").removeClass("js-nav"));
            var c = $(a.target).closest(this.attr.mediaSelector);
            if (this.isOpen() || c.length == 0) return;
            this.resetMinSize(), this.render(c), $("body").addClass("gallery-enabled"), this.select("gallerySelector").addClass("show-controls"), this.on(window, "resize", utils.debounce(this.resizeCurrent.bind(this), 50)), this.on("mousemove", function() {
                this.select("gallerySelector").removeClass("show-controls")
            }.bind(this)), this.trigger("uiGalleryOpened")
        }, this.handleClose = function(a) {
            if (!this.isOpen()) return;
            this.fromGrid ? this.returnToGrid(!0) : this.closeGallery()
        }, this.returnToGrid = function(a) {
            this.trigger(this.$current, "uiOpenGrid", {
                title: this.title,
                fromGallery: a
            }), this.closeGallery()
        }, this.closeGallery = function() {
            $("body").removeClass("gallery-enabled"), this.select("galleryMediaSelector").empty(), this.hideNav(), this.enableNav(!1, !1), this.off(window, "resize"), this.off("mousemove"), this.trigger("uiGalleryClosed")
        }, this.render = function(a) {
            this.clearTweet(), this.$current = a, this.renderNav(), this.trigger(a, "uiGalleryMediaLoad"), this.resolveMedia(a, this.renderMedia.bind(this), "large")
        }, this.renderNav = function() {
            if (!this.$current) return;
            var a = this.$current.prevAll(this.attr.mediaSelector),
                b = this.$current.nextAll(this.attr.mediaSelector),
                c = b.length > 0,
                d = a.length > 0;
            this.enableNav(c, d), c || d ? this.showNav() : this.hideNav()
        }, this.preloadNeighbors = function(a) {
            this.preloadRecursive(a, "next", 2), this.preloadRecursive(a, "prev", 2)
        }, this.clearTweet = function() {
            this.select("galleryTweetSelector").empty()
        }, this.getTweet = function(a) {
            if (!a) return;
            this.tweetHtml[a] ? this.renderTweet(a, this.tweetHtml[a]) : this.trigger("uiGetTweet", {
                id: a
            })
        }, this.gotTweet = function(a, b) {
            b.id && b.tweet_html && (this.tweetHtml[b.id] = b.tweet_html, this.renderTweet(b.id, b.tweet_html))
        }, this.renderTweet = function(a, b) {
            this.$current && this.getTweetId(this.$current) == a && this.select("galleryTweetSelector").empty().append(b)
        }, this.getTweetId = function(a) {
            return a.attr("data-status-id") ? a.attr("data-status-id") : a.closest("[data-tweet-id]").attr("data-tweet-id")
        }, this.preloadRecursive = function(a, b, c) {
            if (c == 0) return;
            var d = a[b](this.attr.mediaSelector);
            if (!d || !d.length) return;
            d.attr("data-preloading", !0), this.resolveMedia(d, function(a, d) {
                if (!a) {
                    d.remove(), this.preloadRecursive(d, b, c);
                    return
                }
                var a = function(a) {
                    d.attr("data-preloaded", !0), this.getTweet(this.getTweetId(d)), this.preloadRecursive(d, b, --c)
                }.bind(this),
                    e = function() {
                        d.remove(), this.preloadRecursive(d, b, c)
                    }.bind(this);
                imageLoader.load(d.attr("data-resolved-url-large"), a, e)
            }.bind(this), "large")
        }, this.renderMedia = function(a, b) {
            a ? (b.attr("data-source-url") ? this.loadVideo(b) : this.loadImage(b), this.preloadNeighbors(b)) : (b.remove(), this.next())
        }, this.loadImage = function(a) {
            var b = $('<img class="media-image"/>');
            b.on("load", function(c) {
                a.attr("loaded", !0), this.select("galleryMediaSelector").empty().append(b), b.attr({
                    "data-height": b[0].height,
                    "data-width": b[0].width
                }), this.resizeMedia(b), this.$current = a, this.getTweet(this.getTweetId(a)), this.trigger("uiGalleryMediaLoaded", {
                    url: b.attr("src"),
                    id: a.attr("data-status-id")
                })
            }.bind(this)), b.on("error", function(c) {
                this.trigger("uiGalleryMediaFailed", {
                    url: b.attr("src"),
                    id: a.attr("data-status-id")
                }), a.remove(), this.next()
            }.bind(this)), b.attr("src", a.attr("data-resolved-url-large")), this.select("gallerySelector").removeClass("video")
        }, this.loadVideo = function(a) {
            var b = $("<iframe>");
            b.height(a.attr("data-height") * 2).width(a.attr("data-width") * 2).attr("data-height", a.attr("data-height") * 2).attr("data-width", a.attr("data-width") * 2).attr("src", a.attr("data-source-url")), a.attr("loaded", !0), this.resizeMedia(b, !0), this.select("galleryMediaSelector").empty().append(b), this.$current = a, this.getTweet(a.attr("data-status-id")), this.select("gallerySelector").addClass("video")
        }, this.resizeCurrent = function() {
            var a = this.select("imageSelector");
            a.length && this.resizeMedia(a)
        }, this.resizeMedia = function(a, b) {
            var c = $(window).height() - 2 * PADDING,
                d = $(window).width() - 2 * PADDING,
                e = this.galH,
                f = this.galW,
                g = c - HEADERHEIGHT,
                h = d,
                i = parseInt(a.height()),
                j = parseInt(a.width()),
                k = this.select("gallerySelector");
            b && (j += 130, i += 100), i > g && (a.height(g), a.width(j * (g / i)), j *= g / i, i = g), j > h && (a.width(h), a.height(i * (h / j)), i *= h / j, j = h), j > this.galW && (this.galW = j, k.width(this.galW)), i + HEADERHEIGHT > this.galH ? (this.galH = i + HEADERHEIGHT, k.height(this.galH), a.css("margin-top", 0), a.addClass("bottom-corners")) : (a.css("margin-top", (this.galH - HEADERHEIGHT - i) / 2), a.removeClass("bottom-corners"))
        }, this.prev = function() {
            this.gotoMedia("prev"), this.trigger("uiGalleryNavigatePrev")
        }, this.next = function() {
            this.gotoMedia("next"), this.trigger("uiGalleryNavigateNext")
        }, this.gotoMedia = function(a) {
            var b = this.$current[a](this.attr.mediaSelector);
            b.length && this.render(b)
        }, this.showNav = function() {
            this.select("navSelector").show()
        }, this.hideNav = function() {
            this.select("navSelector").hide()
        }, this.enableNav = function(a, b) {
            a ? this.select("nextSelector").addClass("enabled") : this.select("nextSelector").removeClass("enabled"), b ? this.select("prevSelector").addClass("enabled") : this.select("prevSelector").removeClass("enabled")
        }, this.throttle = function(a, b, c) {
            var d = !1;
            return function() {
                d || (a.apply(c, arguments), d = !0, setTimeout(function() {
                    d = !1
                }, b))
            }
        }, this.after("initialize", function() {
            this.on(document, "dataGotMoreMediaTimelineItems", this.renderNav), this.on(document, "uiOpenGallery", this.open), this.on(document, "uiCloseGallery", this.closeGallery), this.on(document, "uiShortcutEsc", this.handleClose), this.on(window, "popstate", this.closeGallery), this.on(document, "uiShortcutLeft", this.throttle(this.prev, 200, this)), this.on(document, "uiShortcutRight", this.throttle(this.next, 200, this)), this.on(document, "dataGotTweet", this.gotTweet), this.on("click", {
                prevSelector: this.prev,
                nextSelector: this.next,
                closeSelector: this.handleClose,
                gridSelector: this.closeGallery
            })
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        _ = require("core/i18n"),
        withLegacyMedia = require("app/ui/media/with_legacy_media"),
        imageLoader = require("app/utils/image/image_loader"),
        withScrollbarWidth = require("app/ui/with_scrollbar_width"),
        withItemActions = require("app/ui/with_item_actions"),
        withTweetActions = require("app/ui/with_tweet_actions"),
        withFlagAction = require("app/ui/media/with_flag_action"),
        Gallery = defineComponent(gallery, withLegacyMedia, withItemActions, withTweetActions, withFlagAction, withScrollbarWidth),
        MINHEIGHT = 300,
        MINWIDTH = 520,
        PADDING = 30,
        HEADERHEIGHT = 38;
    module.exports = Gallery
});
define("app/data/gallery_scribe", ["module", "require", "exports", "core/component", "app/data/with_scribe"], function(module, require, exports) {
    function galleryScribe() {
        this.scribeGalleryOpened = function(a, b) {
            this.scribe({
                element: "gallery",
                action: "open"
            }, b)
        }, this.scribeGalleryClosed = function(a, b) {
            this.scribe({
                element: "gallery",
                action: "close"
            }, b)
        }, this.scribeGalleryMediaLoaded = function(a, b) {
            var c = {
                url: b.url,
                item_ids: [b.id]
            };
            this.scribe({
                element: "photo",
                action: "impression"
            }, b, c)
        }, this.scribeGalleryMediaFailed = function(a, b) {
            var c = {
                url: b.url,
                item_ids: [b.id]
            };
            this.scribe({
                element: "photo",
                action: "error"
            }, b, c)
        }, this.scribeGalleryNavigateNext = function(a, b) {
            this.scribe({
                element: "next",
                action: "click"
            }, b)
        }, this.scribeGalleryNavigatePrev = function(a, b) {
            this.scribe({
                element: "prev",
                action: "click"
            }, b)
        }, this.scribeGridPaged = function(a, b) {
            this.scribe({
                element: "grid",
                action: "page"
            }, b)
        }, this.scribeGridOpened = function(a, b) {
            this.scribe({
                element: "grid",
                action: "impression"
            }, b)
        }, this.after("initialize", function() {
            this.on(document, "uiGalleryOpened", this.scribeGalleryOpened), this.on(document, "uiGalleryClosed", this.scribeGalleryClosed), this.on(document, "uiGalleryMediaLoaded", this.scribeGalleryMediaLoaded), this.on(document, "uiGalleryMediaFailed", this.scribeGalleryMediaFailed), this.on(document, "uiGalleryNavigateNext", this.scribeGalleryNavigateNext), this.on(document, "uiGalleryNavigatePrev", this.scribeGalleryNavigatePrev), this.on(document, "uiGridPaged", this.scribeGridPaged), this.on(document, "uiGridOpened", this.scribeGridOpened)
        })
    }
    var defineComponent = require("core/component"),
        withScribe = require("app/data/with_scribe");
    module.exports = defineComponent(galleryScribe, withScribe)
});
define("app/ui/dialogs/share_via_email_dialog", ["module", "require", "exports", "core/component", "app/ui/with_dialog", "app/ui/with_position", "app/data/with_data", "app/ui/dialogs/with_modal_tweet", "app/ui/forms/input_with_placeholder", "core/utils"], function(module, require, exports) {
    function shareViaEmailDialog() {
        this.defaultAttrs({
            contentSelector: ".share-via-email-form .js-share-tweet-container",
            buttonSelector: ".share-via-email-form .primary-btn",
            emailSelector: ".share-via-email-form .js-share-tweet-emails",
            commentSelector: ".share-via-email-form .js-share-comment",
            replyToUserSelector: ".share-via-email-form .js-reply-to-user",
            tweetSelector: ".share-via-email-form .tweet",
            placeholdingInputSelector: ".share-via-email-form .share-tweet-to .placeholding-input",
            placeholdingTextareaSelector: ".share-via-email-form .comment-box .placeholding-input",
            placeholdingSelector: ".share-via-email-form .placeholding-input"
        }), this.openDialog = function(a, b) {
            this.attr.sourceEventData = b, this.removeTweet(), this.addTweet($(a.target).clone().removeClass("retweeted favorited")), this.select("emailSelector").val(""), this.select("commentSelector").val(""), this.select("placeholdingSelector").removeClass("hasome"), this.open(), this.trigger("uiShareViaEmailDialogOpened", utils.merge(b, {
                scribeContext: {
                    component: "share_via_email_dialog"
                }
            }))
        }, this.submitForm = function(a) {
            var b = {
                id: this.select("tweetSelector").attr("data-tweet-id"),
                emails: this.select("emailSelector").val(),
                comment: this.select("commentSelector").val(),
                reply_to_user: this.select("replyToUserSelector").is(":checked")
            };
            this.post({
                url: "/i/tweet/share_via_email",
                data: b,
                eventData: null,
                success: "dataShareViaEmailSuccess",
                error: "dataShareViaEmailError"
            }), this.trigger("uiCloseDialog"), a.preventDefault()
        }, this.shareSuccess = function(a, b) {
            this.trigger("uiShowMessage", {
                message: b.message
            }), this.trigger("uiDidShareViaEmailSuccess", this.attr.sourceEventData)
        }, this.after("initialize", function() {
            this.on(document, "uiNeedsShareViaEmailDialog", this.openDialog), this.on(document, "dataShareViaEmailSuccess", this.shareSuccess), this.on("click", {
                buttonSelector: this.submitForm
            }), InputWithPlaceholder.attachTo(this.attr.placeholdingInputSelector, {
                hidePlaceholderClassName: "hasome",
                placeholder: ".placeholder",
                elementType: "input"
            }), InputWithPlaceholder.attachTo(this.attr.placeholdingTextareaSelector, {
                hidePlaceholderClassName: "hasome",
                placeholder: ".placeholder",
                elementType: "textarea"
            })
        })
    }
    var defineComponent = require("core/component"),
        withDialog = require("app/ui/with_dialog"),
        withPosition = require("app/ui/with_position"),
        withData = require("app/data/with_data"),
        withModalTweet = require("app/ui/dialogs/with_modal_tweet"),
        InputWithPlaceholder = require("app/ui/forms/input_with_placeholder"),
        utils = require("core/utils"),
        ShareViaEmailDialog = defineComponent(shareViaEmailDialog, withDialog, withPosition, withData, withModalTweet);
    module.exports = ShareViaEmailDialog
});
define("app/data/with_widgets", ["module", "require", "exports", "core/component"], function(module, require, exports) {
    function withWidgets() {
        this.widgetsAreLoaded = function() {
            return !!this.widgets && !! this.widgets.init
        }, this.widgetsProvidesNewEmbed = function() {
            return !!this.widgetsAreLoaded() && !! this.widgets.widgets && typeof this.widgets.widgets.createTweetEmbed == "function"
        }, this.getWidgets = function() {
            window.twttr || this.asyncWidgetsLoader(), this.widgets = window.twttr, window.twttr.ready(this._widgetsReady.bind(this))
        }, this._widgetsReady = function(_) {
            this.widgetsReady && this.widgetsReady()
        }, this.asyncWidgetsLoader = function() {
            window.twttr = function(a, b, c) {
                var d, e, f = a.getElementsByTagName(b)[0];
                if (a.getElementById(c)) return;
                return e = a.createElement(b), e.id = c, e.src = "//platform.twitter.com/widgets.js", f.parentNode.insertBefore(e, f), window.twttr || (d = {
                    _e: [],
                    ready: function(a) {
                        d._e.push(a)
                    }
                })
            }(document, "script", "twitter-wjs")
        }
    }
    var defineComponent = require("core/component"),
        WithWidgets = defineComponent(withWidgets);
    module.exports = withWidgets
});
define("app/ui/dialogs/embed_tweet2", ["module", "require", "exports", "core/component", "app/ui/with_position", "app/ui/with_dialog", "app/data/with_data", "app/data/with_interaction_data_scribe", "app/data/with_card_metadata", "app/data/with_widgets", "core/utils"], function(module, require, exports) {
    function embedTweetDialog2() {
        this.defaultAttrs({
            dialogSelector: "#embed-tweet-dialog-v2",
            dialogContentSelector: "#embed-tweet-dialog-v2 .modal-content",
            previewContainerSelector: ".embed-preview",
            embedFrameSelector: ".embed-preview IFRAME",
            visibleEmbedFrameSelector: ".embed-preview IFRAME:visible",
            embedCodeDestinationSelector: ".embed-destination",
            triggerSelector: ".js-embed-tweet",
            overlaySelector: ".embed-overlay",
            spinnerOverlaySelector: ".embed-overlay-spinner",
            errorOverlaySelector: ".embed-overlay-error",
            tryAgainSelector: ".embed-overlay-error a",
            includeParentTweetContainerSelector: ".embed-include-parent-tweet",
            includeParentTweetSelector: ".include-parent-tweet",
            includeCardContainerSelector: ".embed-include-card",
            includeCardSelector: ".include-card",
            embedWidth: "469px",
            top: "90px"
        }), this.cacheKeyForOptions = function(a) {
            return JSON.stringify(a) + this.tweetId()
        }, this.didReceiveEmbedCode = function(a, b) {
            var c = this.cacheKeyForOptions(a);
            this.cachedEmbedCodes[c] = b;
            if (c != this.cacheKeyForOptions(this.getOptions())) return;
            this.select("overlaySelector").hide(), this.$embedCodeDestination.val(b.html).focus(), this.selectEmbedCode()
        }, this.failedToReceiveEmbedCode = function(a, b) {
            var c = this.cacheKeyForOptions(a),
                d, e;
            this.scribeEmbedAction("request_failed");
            if (c != this.cacheKeyForOptions(this.getOptions())) return;
            this.select("overlaySelector").hide(), b ? (this.select("spinnerOverlaySelector").show(), d = this.didReceiveEmbedCode.bind(this, a), e = this.failedToReceiveEmbedCode.bind(this, a, !1), this.requestEmbedCode(a, d, e)) : (this.select("embedCodeDestinationSelector").hide(), this.select("errorOverlaySelector").show())
        }, this.requestEmbedCode = function(a, b, c) {
            var d = this.cacheKeyForOptions(a);
            if (this.cachedEmbedCodes[d]) {
                this.didReceiveEmbedCode(a, this.cachedEmbedCodes[d]);
                return
            }
            this.select("embedCodeDestinationSelector").val(""), this.get({
                url: this.embedCodeUrl(),
                headers: {
                    "X-PHX": 1
                },
                data: a,
                eventData: {},
                success: b,
                error: c
            })
        }, this.updateEmbedCode = function(a) {
            var b = this.getOptions(),
                c = this.didReceiveEmbedCode.bind(this, b),
                d = this.failedToReceiveEmbedCode.bind(this, b, !0);
            this.select("embedCodeDestinationSelector").show(), this.select("overlaySelector").hide(), this.requestEmbedCode(b, c, d)
        }, this.requestTweetEmbed = function() {
            if (!this.widgetsProvidesNewEmbed()) return;
            var a = this.getOptions(),
                b = this.cacheKeyForOptions(a);
            if (this.cachedTweetEmbeds[b]) {
                this.displayCachedTweetEmbed(b);
                return
            }
            this.clearTweetEmbed(), this.widgets.widgets.createTweetEmbed(this.tweetId(), this.select("previewContainerSelector")[0], this.receivedTweetEmbed.bind(this, b), {
                width: this.attr.embedWidth,
                conversation: a.hide_thread ? "none" : "all",
                cards: a.hide_media ? "hidden" : "shown"
            })
        }, this.clearTweetEmbed = function() {
            var a = this.select("visibleEmbedFrameSelector");
            this.stopPlayer(), a.hide()
        }, this.tearDown = function() {
            this.stopPlayer(), this.clearTweetEmbed()
        }, this.stopPlayer = function() {
            var a = this.select("embedFrameSelector");
            a.each(function(a, b) {
                var c = $(b.contentWindow.document),
                    d = c.find("div.media iframe")[0],
                    e;
                if (!d || !d.src || d.src == document.location.href) return;
                e = d.src, d.setAttribute("src", ""), d.setAttribute("src", e)
            })
        }, this.displayCachedTweetEmbed = function(a) {
            this.clearTweetEmbed(), $(this.cachedTweetEmbeds[a]).show()
        }, this.receivedTweetEmbed = function(a, b) {
            b ? this.cachedTweetEmbeds[a] = b : this.scribeEmbedAction("embed_request_failed")
        }, this.embedCodeCopied = function(a) {
            this.scribeEmbedAction("copy")
        }, this.includeParentTweet = function() {
            return this.$includeParentTweet.attr("checked") == "checked"
        }, this.showCard = function() {
            return this.$includeCard.attr("checked") == "checked"
        }, this.getOptions = function() {
            return {
                lang: this.lang,
                hide_thread: !this.includeParentTweet(),
                hide_media: !this.showCard()
            }
        }, this.selectEmbedCode = function() {
            this.$embedCode.select()
        }, this.setUpDialog = function(a, b) {
            this.position(), this.eventData = a, this.tweetData = b, this.toggleIncludeParent(), this.toggleShowCard(), this.resetIncludeParent(), this.resetShowCard(), this.updateEmbedCode(), this.requestTweetEmbed(), this.scribeEmbedAction("open"), this.open(), this.fixPosition()
        }, this.fixPosition = function() {
            this.$dialog.css({
                position: "relative",
                top: this.attr.top
            })
        }, this.scribeEmbedAction = function(a) {
            this.scribeInteraction(a, utils.merge(this.tweetData, {
                scribeContext: {
                    component: "embed_tweet_dialog"
                }
            }))
        }, this.resetIncludeParent = function() {
            var a = this.cacheKeyForOptions(this.getOptions());
            if (this.cachedTweetEmbeds[a]) return;
            this.$includeParentTweet.attr("checked", "CHECKED")
        }, this.resetShowCard = function() {
            var a = this.cacheKeyForOptions(this.getOptions());
            if (this.cachedTweetEmbeds[a]) return;
            this.$includeCard.attr("checked", "CHECKED")
        }, this.toggleIncludeParent = function() {
            this.tweetHasParent() ? this.$includeParentCheckboxContainer.show() : this.$includeParentCheckboxContainer.hide()
        }, this.toggleShowCard = function() {
            this.tweetHasCard() ? this.$includeCardCheckboxContainer.show() : this.$includeCardCheckboxContainer.hide()
        }, this.tweetId = function() {
            return this.tweetData.tweetId
        }, this.tweetHasParent = function() {
            return this.tweetData.hasParentTweet
        }, this.tweetHasCard = function() {
            return this.getCardDataFromTweet($(this.eventData.target)).tweetHasCard
        }, this.screenName = function() {
            return this.tweetData.screenName
        }, this.embedCodeUrl = function() {
            return ["/", this.screenName(), "/oembed/", this.tweetId(), ".json"].join("")
        }, this.widgetsReady = function() {
            this.$dialogContainer && this.isOpen() && this.requestTweetEmbed()
        }, this.onOptionChange = function() {
            this.updateEmbedCode(), this.requestTweetEmbed()
        }, this.after("initialize", function() {
            this.$includeParentTweet = this.select("includeParentTweetSelector"), this.$embedCodeDestination = this.select("embedCodeDestinationSelector"), this.$includeParentCheckboxContainer = this.select("includeParentTweetContainerSelector"), this.$includeCard = this.select("includeCardSelector"), this.$includeCardCheckboxContainer = this.select("includeCardContainerSelector"), this.$embedCode = this.select("embedCodeDestinationSelector"), this.on(this.$embedCodeDestination, "copy cut", this.embedCodeCopied), this.on(document, "uiNeedsEmbedTweetDialog", this.setUpDialog), this.on(this.$embedCode, "click", this.selectEmbedCode), this.getWidgets(), this.on("click", {
                tryAgainSelector: this.updateEmbedCode
            }), this.on("change", {
                includeParentTweetSelector: this.onOptionChange,
                includeCardSelector: this.onOptionChange
            }), this.on("uiDialogCloseRequested", this.tearDown), this.lang = document.documentElement.getAttribute("lang"), this.cachedEmbedCodes = {}, this.cachedTweetEmbeds = {}
        })
    }
    var defineComponent = require("core/component"),
        withPosition = require("app/ui/with_position"),
        withDialog = require("app/ui/with_dialog"),
        withData = require("app/data/with_data"),
        withInteractionScribe = require("app/data/with_interaction_data_scribe"),
        withCardMetadata = require("app/data/with_card_metadata"),
        withWidgets = require("app/data/with_widgets"),
        utils = require("core/utils"),
        EmbedTweetDialog2 = defineComponent(embedTweetDialog2, withDialog, withPosition, withData, withInteractionScribe, withCardMetadata, withWidgets);
    module.exports = EmbedTweetDialog2
});
define("app/ui/dialogs/uz_survey", ["module", "require", "exports", "core/component"], function(module, require, exports) {
    function uzSurvey() {
        this.defaultAttrs({
            backgroundSelector: "#uz_bg",
            containerSelector: "#uz_popup_container",
            backgroundParentSelector: "body",
            blockSurveyClass: "uz_spam_block_survey",
            reportSpamSurveyClass: "uz_spam_report_survey"
        }), this.fadeoutSurvey = function(a) {
            $(this.attr.containerSelector).fadeOut(500)
        }, this.openSurvey = function() {
            window._uzactions = window._uzactions || [];
            var a = this.overrideCookie ? this.overrideCookie : "twittersurvey" + this.surveyId;
            _uzactions.push(["_setCookie", a]);
            var b = document.getElementsByTagName("script")[0];
            b.parentNode.insertBefore($.extend(document.createElement("script"), {
                type: "text/javascript",
                async: !0,
                id: "injected_uz_survey_script",
                charset: "utf-8",
                src: "//cdn4.userzoom.com/files/js/" + this.surveyId + ".js?t=uz_til&cuid=2BA733EB49F6DF1188490022196C4538"
            }), b)
        }, this.onBlockAction = function() {
            this.$node.hasClass(this.attr.blockSurveyClass) && this.openSurvey()
        }, this.onReportSpamAction = function() {
            this.$node.hasClass(this.attr.reportSpamSurveyClass) && this.openSurvey()
        }, this.after("initialize", function() {
            this.surveyId = this.$node.attr("data-survey-id"), this.overrideCookie = this.$node.attr("data-override-cookie"), this.$node.attr("data-show") && this.on(document, "uiSwiftLoaded", this.openSurvey), this.on(document, "uiBlockAction", this.onBlockAction), this.on(document, "uiOpenSurvey", this.openSurvey), this.on(document, "uiReportSpamAction", this.onReportSpamAction), this.on(this.attr.backgroundParentSelector, "click", {
                backgroundSelector: this.fadeoutSurvey
            })
        })
    }
    var defineComponent = require("core/component");
    module.exports = defineComponent(uzSurvey)
});
define("app/ui/with_drag_events", ["module", "require", "exports"], function(module, require, exports) {
    function withDragEvents() {
        this.childHover = function(a) {
            $.contains(this.$node.get(0), a.target) && (a.stopImmediatePropagation(), this.inChild = a.type === "dragenter")
        }, this.hover = function(a) {
            a.preventDefault();
            if (this.inChild) return !1;
            this.trigger(a.type === "dragenter" ? "uiDragEnter" : "uiDragLeave")
        }, this.finish = function(a) {
            a.stopImmediatePropagation(), this.inChild = !1, this.trigger("uiDragLeave")
        }, this.preventDefault = function(a) {
            return a.preventDefault(), !1
        }, this.outOfBounds = function(a) {
            (a.originalEvent.pageX <= 0 || a.originalEvent.pageY <= 0) && this.trigger("uiDragEnd")
        }, this.after("initialize", function() {
            this.inChild = !1, this.on("dragenter dragleave", this.hover), this.on(document, "dragleave", this.outOfBounds), this.on("dragover drop", this.preventDefault), this.on("dragenter dragleave", this.childHover), this.on(document, "uiDragEnd drop", this.finish)
        })
    }
    module.exports = withDragEvents
});
define("app/ui/drag_state", ["module", "require", "exports", "core/component", "app/ui/with_drag_events"], function(module, require, exports) {
    function dragState() {
        this.drageEnter = function() {
            this.$node.addClass("currently-dragging")
        }, this.dragLeave = function() {
            this.$node.removeClass("currently-dragging")
        }, this.after("initialize", function() {
            this.on("uiDragEnter", this.drageEnter), this.on("uiDragLeave uiDrop", this.dragLeave)
        })
    }
    var defineComponent = require("core/component"),
        withDragEvents = require("app/ui/with_drag_events");
    module.exports = defineComponent(dragState, withDragEvents)
});
define("app/boot/app", ["module", "require", "exports", "app/boot/common", "app/boot/top_bar", "app/ui/keyboard_shortcuts", "app/ui/dialogs/keyboard_shortcuts_dialog", "app/ui/dialogs/retweet_dialog", "app/ui/dialogs/delete_tweet_dialog", "app/ui/dialogs/block_user_dialog", "app/ui/dialogs/confirm_dialog", "app/ui/dialogs/list_membership_dialog", "app/ui/dialogs/list_operations_dialog", "app/boot/direct_messages", "app/boot/profile_popup", "app/data/autocomplete_scribe", "app/data/typeahead/typeahead", "app/data/typeahead_scribe", "app/ui/dialogs/goto_user_dialog", "app/utils/setup_polling_with_backoff", "app/ui/page_title", "app/ui/navigation_links", "app/ui/feedback/feedback_dialog", "app/ui/feedback/feedback_report_link_handler", "app/data/feedback/feedback", "app/ui/search_query_source", "app/ui/banners/email_banner", "app/data/email_banner", "app/ui/gallery/gallery", "app/data/gallery_scribe", "app/ui/dialogs/share_via_email_dialog", "app/ui/dialogs/embed_tweet2", "app/ui/dialogs/uz_survey", "app/ui/drag_state"], function(module, require, exports) {
    var bootCommon = require("app/boot/common"),
        topBar = require("app/boot/top_bar"),
        KeyboardShortcuts = require("app/ui/keyboard_shortcuts"),
        KeyboardShortcutsDialog = require("app/ui/dialogs/keyboard_shortcuts_dialog"),
        RetweetDialog = require("app/ui/dialogs/retweet_dialog"),
        DeleteTweetDialog = require("app/ui/dialogs/delete_tweet_dialog"),
        BlockUserDialog = require("app/ui/dialogs/block_user_dialog"),
        ConfirmDialog = require("app/ui/dialogs/confirm_dialog"),
        ListMembershipDialog = require("app/ui/dialogs/list_membership_dialog"),
        ListOperationsDialog = require("app/ui/dialogs/list_operations_dialog"),
        directMessages = require("app/boot/direct_messages"),
        profilePopup = require("app/boot/profile_popup"),
        AutocompleteScribe = require("app/data/autocomplete_scribe"),
        TypeaheadData = require("app/data/typeahead/typeahead"),
        TypeaheadScribe = require("app/data/typeahead_scribe"),
        GotoUserDialog = require("app/ui/dialogs/goto_user_dialog"),
        setupPollingWithBackoff = require("app/utils/setup_polling_with_backoff"),
        PageTitle = require("app/ui/page_title"),
        NavigationLinks = require("app/ui/navigation_links"),
        FeedbackDialog = require("app/ui/feedback/feedback_dialog"),
        FeedbackReportLinkHandler = require("app/ui/feedback/feedback_report_link_handler"),
        Feedback = require("app/data/feedback/feedback"),
        SearchQuerySource = require("app/ui/search_query_source"),
        EmailBanner = require("app/ui/banners/email_banner"),
        EmailBannerData = require("app/data/email_banner"),
        Gallery = require("app/ui/gallery/gallery"),
        GalleryScribe = require("app/data/gallery_scribe"),
        ShareViaEmailDialog = require("app/ui/dialogs/share_via_email_dialog"),
        EmbedTweetDialog2 = require("app/ui/dialogs/embed_tweet2"),
        uzSurvey = require("app/ui/dialogs/uz_survey"),
        DragState = require("app/ui/drag_state");
    module.exports = function(b) {
        bootCommon(b), topBar(b), PageTitle.attachTo(document), b.dragAndDropPhotoUpload && DragState.attachTo("body"), SearchQuerySource.attachTo("body"), ConfirmDialog.attachTo("#confirm_dialog"), b.loggedIn && (ListMembershipDialog.attachTo("#list-membership-dialog", b), ListOperationsDialog.attachTo("#list-operations-dialog", b), directMessages(b), EmailBanner.attachTo(document), EmailBannerData.attachTo(document)), AutocompleteScribe.attachTo(document), TypeaheadScribe.attachTo(document), TypeaheadData.attachTo(document, b.typeaheadData), GotoUserDialog.attachTo("#goto-user-dialog", b), profilePopup({
            deviceEnabled: b.deviceEnabled,
            deviceVerified: b.deviceVerified,
            formAuthenticityToken: b.formAuthenticityToken,
            loggedIn: b.loggedIn,
            asyncSocialProof: b.asyncSocialProof
        }), GalleryScribe.attachTo(document), Gallery.attachTo(".gallery-container", b, {
            sandboxes: b.sandboxes,
            loggedIn: b.loggedIn,
            eventData: {
                scribeContext: {
                    component: "gallery"
                }
            }
        }), KeyboardShortcutsDialog.attachTo("#keyboard-shortcut-dialog", b), RetweetDialog.attachTo("#retweet-tweet-dialog", b), DeleteTweetDialog.attachTo("#delete-tweet-dialog", b), BlockUserDialog.attachTo("#block-user-dialog", b), KeyboardShortcuts.attachTo(document), ShareViaEmailDialog.attachTo("#share-via-email-dialog", b), EmbedTweetDialog2.attachTo("#embed-tweet-dialog-v2", b), setupPollingWithBackoff("uiWantsToRefreshTimestamps"), NavigationLinks.attachTo(".dashboard", {
            eventData: {
                scribeContext: {
                    component: "dashboard_nav"
                }
            }
        }), FeedbackDialog.attachTo("#feedback_dialog", b.debugData), Feedback.attachTo(document, b.debugData), $(".uz_spam_block_survey")[0] && uzSurvey.attachTo(".uz_spam_block_survey"), $(".uz_spam_report_survey")[0] && uzSurvey.attachTo(".uz_spam_report_survey"), FeedbackReportLinkHandler.attachTo(document, b.debugData)
    }
});
define("lib/twitter_cldr", ["module", "require", "exports"], function(module, require, exports) {
    (function() {
        var a, b, c, d;
        a = {}, a.is_rtl = !1, a.Utilities = function() {
            function a() {}
            return a.from_char_code = function(a) {
                return a > 65535 ? (a -= 65536, String.fromCharCode(55296 + (a >> 10), 56320 + (a & 1023))) : String.fromCharCode(a)
            }, a.char_code_at = function(a, b) {
                var c, d, e, f, g, h;
                a += "", d = a.length, h = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
                while (h.exec(a) !== null) {
                    f = h.lastIndex;
                    if (!(f - 2 < b)) break;
                    b += 1
                }
                return b >= d || b < 0 ? NaN : (c = a.charCodeAt(b), 55296 <= c && c <= 56319 ? (e = c, g = a.charCodeAt(b + 1), (e - 55296) * 1024 + (g - 56320) + 65536) : c)
            }, a.unpack_string = function(a) {
                var b, c, d, e, f;
                d = [];
                for (c = e = 0, f = a.length; 0 <= f ? e < f : e > f; c = 0 <= f ? ++e : --e) {
                    b = this.char_code_at(a, c);
                    if (!b) break;
                    d.push(b)
                }
                return d
            }, a.pack_array = function(a) {
                var b;
                return function() {
                    var c, d, e;
                    e = [];
                    for (c = 0, d = a.length; c < d; c++) b = a[c], e.push(this.from_char_code(b));
                    return e
                }.call(this).join("")
            }, a.arraycopy = function(a, b, c, d, e) {
                var f, g, h, i, j;
                j = a.slice(b, b + e);
                for (f = h = 0, i = j.length; h < i; f = ++h) g = j[f], c[d + f] = g
            }, a.max = function(a) {
                var b, c, d, e, f, g, h, i;
                d = null;
                for (e = f = 0, h = a.length; f < h; e = ++f) {
                    b = a[e];
                    if (b != null) {
                        d = b;
                        break
                    }
                }
                for (c = g = e, i = a.length; e <= i ? g <= i : g >= i; c = e <= i ? ++g : --g) a[c] > d && (d = a[c]);
                return d
            }, a.min = function(a) {
                var b, c, d, e, f, g, h, i;
                d = null;
                for (e = f = 0, h = a.length; f < h; e = ++f) {
                    b = a[e];
                    if (b != null) {
                        d = b;
                        break
                    }
                }
                for (c = g = e, i = a.length; e <= i ? g <= i : g >= i; c = e <= i ? ++g : --g) a[c] < d && (d = a[c]);
                return d
            }, a.is_even = function(a) {
                return a % 2 === 0
            }, a.is_odd = function(a) {
                return a % 2 === 1
            }, a
        }(), a.PluralRules = function() {
            function a() {}
            return a.rules = {
                keys: ["one", "other"],
                rule: function(a) {
                    return function() {
                        return a == 1 ? "one" : "other"
                    }()
                }
            }, a.all = function() {
                return this.rules.keys
            }, a.rule_for = function(a) {
                try {
                    return this.rules.rule(a)
                } catch (b) {
                    return "other"
                }
            }, a
        }(), a.TimespanFormatter = function() {
            function b() {
                this.approximate_multiplier = .75, this.default_type = "default", this.tokens = {
                    ago: {
                        second: {
                            "default": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " second ago",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " seconds ago",
                                    type: "plaintext"
                                }]
                            }
                        },
                        minute: {
                            "default": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " minute ago",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " minutes ago",
                                    type: "plaintext"
                                }]
                            }
                        },
                        hour: {
                            "default": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " hour ago",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " hours ago",
                                    type: "plaintext"
                                }]
                            }
                        },
                        day: {
                            "default": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " day ago",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " days ago",
                                    type: "plaintext"
                                }]
                            }
                        },
                        week: {
                            "default": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " week ago",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " weeks ago",
                                    type: "plaintext"
                                }]
                            }
                        },
                        month: {
                            "default": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " month ago",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " months ago",
                                    type: "plaintext"
                                }]
                            }
                        },
                        year: {
                            "default": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " year ago",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " years ago",
                                    type: "plaintext"
                                }]
                            }
                        }
                    },
                    until: {
                        second: {
                            "default": {
                                one: [{
                                    value: "In ",
                                    type: "plaintext"
                                }, {
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " second",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "In ",
                                    type: "plaintext"
                                }, {
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " seconds",
                                    type: "plaintext"
                                }]
                            }
                        },
                        minute: {
                            "default": {
                                one: [{
                                    value: "In ",
                                    type: "plaintext"
                                }, {
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " minute",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "In ",
                                    type: "plaintext"
                                }, {
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " minutes",
                                    type: "plaintext"
                                }]
                            }
                        },
                        hour: {
                            "default": {
                                one: [{
                                    value: "In ",
                                    type: "plaintext"
                                }, {
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " hour",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "In ",
                                    type: "plaintext"
                                }, {
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " hours",
                                    type: "plaintext"
                                }]
                            }
                        },
                        day: {
                            "default": {
                                one: [{
                                    value: "In ",
                                    type: "plaintext"
                                }, {
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " day",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "In ",
                                    type: "plaintext"
                                }, {
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " days",
                                    type: "plaintext"
                                }]
                            }
                        },
                        week: {
                            "default": {
                                one: [{
                                    value: "In ",
                                    type: "plaintext"
                                }, {
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " week",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "In ",
                                    type: "plaintext"
                                }, {
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " weeks",
                                    type: "plaintext"
                                }]
                            }
                        },
                        month: {
                            "default": {
                                one: [{
                                    value: "In ",
                                    type: "plaintext"
                                }, {
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " month",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "In ",
                                    type: "plaintext"
                                }, {
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " months",
                                    type: "plaintext"
                                }]
                            }
                        },
                        year: {
                            "default": {
                                one: [{
                                    value: "In ",
                                    type: "plaintext"
                                }, {
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " year",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "In ",
                                    type: "plaintext"
                                }, {
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " years",
                                    type: "plaintext"
                                }]
                            }
                        }
                    },
                    none: {
                        second: {
                            "default": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " second",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " seconds",
                                    type: "plaintext"
                                }]
                            },
                            "short": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " sec",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " secs",
                                    type: "plaintext"
                                }]
                            },
                            abbreviated: {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: "s",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: "s",
                                    type: "plaintext"
                                }]
                            }
                        },
                        minute: {
                            "default": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " minute",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " minutes",
                                    type: "plaintext"
                                }]
                            },
                            "short": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " min",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " mins",
                                    type: "plaintext"
                                }]
                            },
                            abbreviated: {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: "m",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: "m",
                                    type: "plaintext"
                                }]
                            }
                        },
                        hour: {
                            "default": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " hour",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " hours",
                                    type: "plaintext"
                                }]
                            },
                            "short": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " hr",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " hrs",
                                    type: "plaintext"
                                }]
                            },
                            abbreviated: {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: "h",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: "h",
                                    type: "plaintext"
                                }]
                            }
                        },
                        day: {
                            "default": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " day",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " days",
                                    type: "plaintext"
                                }]
                            },
                            "short": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " day",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " days",
                                    type: "plaintext"
                                }]
                            },
                            abbreviated: {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: "d",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: "d",
                                    type: "plaintext"
                                }]
                            }
                        },
                        week: {
                            "default": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " week",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " weeks",
                                    type: "plaintext"
                                }]
                            },
                            "short": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " wk",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " wks",
                                    type: "plaintext"
                                }]
                            }
                        },
                        month: {
                            "default": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " month",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " months",
                                    type: "plaintext"
                                }]
                            },
                            "short": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " mth",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " mths",
                                    type: "plaintext"
                                }]
                            }
                        },
                        year: {
                            "default": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " year",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " years",
                                    type: "plaintext"
                                }]
                            },
                            "short": {
                                one: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " yr",
                                    type: "plaintext"
                                }],
                                other: [{
                                    value: "{0}",
                                    type: "placeholder"
                                }, {
                                    value: " yrs",
                                    type: "plaintext"
                                }]
                            }
                        }
                    }
                }, this.time_in_seconds = {
                    second: 1,
                    minute: 60,
                    hour: 3600,
                    day: 86400,
                    week: 604800,
                    month: 2629743.83,
                    year: 31556926
                }
            }
            return b.prototype.format = function(b, c) {
                var d, e, f, g, h, i;
                c == null && (c = {}), g = {};
                for (d in c) f = c[d], g[d] = f;
                g.direction || (g.direction = b < 0 ? "ago" : "until");
                if (g.unit === null || g.unit === void 0) g.unit = this.calculate_unit(Math.abs(b), g);
                return g.type || (g.type = this.default_type), g.number = this.calculate_time(Math.abs(b), g.unit), e = this.calculate_time(Math.abs(b), g.unit), g.rule = a.PluralRules.rule_for(e), h = function() {
                    var a, b, c, d;
                    c = this.tokens[g.direction][g.unit][g.type][g.rule], d = [];
                    for (a = 0, b = c.length; a < b; a++) i = c[a], d.push(i.value);
                    return d
                }.call(this), h.join("").replace(/\{[0-9]\}/, e.toString())
            }, b.prototype.calculate_unit = function(a, b) {
                var c, d, e, f;
                b == null && (b = {}), f = {};
                for (c in b) e = b[c], f[c] = e;
                return f.approximate == null && (f.approximate = !1), d = f.approximate ? this.approximate_multiplier : 1, a < this.time_in_seconds.minute * d ? "second" : a < this.time_in_seconds.hour * d ? "minute" : a < this.time_in_seconds.day * d ? "hour" : a < this.time_in_seconds.week * d ? "day" : a < this.time_in_seconds.month * d ? "week" : a < this.time_in_seconds.year * d ? "month" : "year"
            }, b.prototype.calculate_time = function(a, b) {
                return Math.round(a / this.time_in_seconds[b])
            }, b
        }(), a.DateTimeFormatter = function() {
            function b() {
                this.tokens = {
                    date_time: {
                        "default": [{
                            value: "MMM",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "d",
                            type: "pattern"
                        }, {
                            value: ", ",
                            type: "plaintext"
                        }, {
                            value: "y",
                            type: "pattern"
                        }, {
                            value: ",",
                            type: "plaintext"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "h",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "mm",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "ss",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "a",
                            type: "pattern"
                        }],
                        full: [{
                            value: "EEEE",
                            type: "pattern"
                        }, {
                            value: ", ",
                            type: "plaintext"
                        }, {
                            value: "MMMM",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "d",
                            type: "pattern"
                        }, {
                            value: ", ",
                            type: "plaintext"
                        }, {
                            value: "y",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "'",
                            type: "plaintext"
                        }, {
                            value: "a",
                            type: "plaintext"
                        }, {
                            value: "t",
                            type: "plaintext"
                        }, {
                            value: "'",
                            type: "plaintext"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "h",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "mm",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "ss",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "a",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "zzzz",
                            type: "pattern"
                        }],
                        "long": [{
                            value: "MMMM",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "d",
                            type: "pattern"
                        }, {
                            value: ", ",
                            type: "plaintext"
                        }, {
                            value: "y",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "'",
                            type: "plaintext"
                        }, {
                            value: "a",
                            type: "plaintext"
                        }, {
                            value: "t",
                            type: "plaintext"
                        }, {
                            value: "'",
                            type: "plaintext"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "h",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "mm",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "ss",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "a",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "z",
                            type: "pattern"
                        }],
                        medium: [{
                            value: "MMM",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "d",
                            type: "pattern"
                        }, {
                            value: ", ",
                            type: "plaintext"
                        }, {
                            value: "y",
                            type: "pattern"
                        }, {
                            value: ",",
                            type: "plaintext"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "h",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "mm",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "ss",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "a",
                            type: "pattern"
                        }],
                        "short": [{
                            value: "M",
                            type: "pattern"
                        }, {
                            value: "/",
                            type: "plaintext"
                        }, {
                            value: "d",
                            type: "pattern"
                        }, {
                            value: "/",
                            type: "plaintext"
                        }, {
                            value: "yy",
                            type: "pattern"
                        }, {
                            value: ",",
                            type: "plaintext"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "h",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "mm",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "a",
                            type: "pattern"
                        }],
                        additional: {
                            EHm: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "HH",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }],
                            EHms: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "HH",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "ss",
                                type: "pattern"
                            }],
                            Ed: [{
                                value: "d",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "E",
                                type: "pattern"
                            }],
                            Ehm: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "h",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "a",
                                type: "pattern"
                            }],
                            Ehms: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "h",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "ss",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "a",
                                type: "pattern"
                            }],
                            Gy: [{
                                value: "y",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "G",
                                type: "pattern"
                            }],
                            H: [{
                                value: "HH",
                                type: "pattern"
                            }],
                            Hm: [{
                                value: "HH",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }],
                            Hms: [{
                                value: "HH",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "ss",
                                type: "pattern"
                            }],
                            M: [{
                                value: "L",
                                type: "pattern"
                            }],
                            MEd: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "M",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }],
                            MMM: [{
                                value: "LLL",
                                type: "pattern"
                            }],
                            MMMEd: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "MMM",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }],
                            MMMd: [{
                                value: "MMM",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }],
                            Md: [{
                                value: "M",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }],
                            d: [{
                                value: "d",
                                type: "pattern"
                            }],
                            h: [{
                                value: "h",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "a",
                                type: "pattern"
                            }],
                            hm: [{
                                value: "h",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "a",
                                type: "pattern"
                            }],
                            hms: [{
                                value: "h",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "ss",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "a",
                                type: "pattern"
                            }],
                            ms: [{
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "ss",
                                type: "pattern"
                            }],
                            y: [{
                                value: "y",
                                type: "pattern"
                            }],
                            yM: [{
                                value: "M",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yMEd: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "M",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yMMM: [{
                                value: "MMM",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yMMMEd: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "MMM",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yMMMd: [{
                                value: "MMM",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yMd: [{
                                value: "M",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yQQQ: [{
                                value: "QQQ",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yQQQQ: [{
                                value: "QQQQ",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }]
                        }
                    },
                    time: {
                        "default": [{
                            value: "h",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "mm",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "ss",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "a",
                            type: "pattern"
                        }],
                        full: [{
                            value: "h",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "mm",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "ss",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "a",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "zzzz",
                            type: "pattern"
                        }],
                        "long": [{
                            value: "h",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "mm",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "ss",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "a",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "z",
                            type: "pattern"
                        }],
                        medium: [{
                            value: "h",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "mm",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "ss",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "a",
                            type: "pattern"
                        }],
                        "short": [{
                            value: "h",
                            type: "pattern"
                        }, {
                            value: ":",
                            type: "plaintext"
                        }, {
                            value: "mm",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "a",
                            type: "pattern"
                        }],
                        additional: {
                            EHm: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "HH",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }],
                            EHms: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "HH",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "ss",
                                type: "pattern"
                            }],
                            Ed: [{
                                value: "d",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "E",
                                type: "pattern"
                            }],
                            Ehm: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "h",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "a",
                                type: "pattern"
                            }],
                            Ehms: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "h",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "ss",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "a",
                                type: "pattern"
                            }],
                            Gy: [{
                                value: "y",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "G",
                                type: "pattern"
                            }],
                            H: [{
                                value: "HH",
                                type: "pattern"
                            }],
                            Hm: [{
                                value: "HH",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }],
                            Hms: [{
                                value: "HH",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "ss",
                                type: "pattern"
                            }],
                            M: [{
                                value: "L",
                                type: "pattern"
                            }],
                            MEd: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "M",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }],
                            MMM: [{
                                value: "LLL",
                                type: "pattern"
                            }],
                            MMMEd: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "MMM",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }],
                            MMMd: [{
                                value: "MMM",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }],
                            Md: [{
                                value: "M",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }],
                            d: [{
                                value: "d",
                                type: "pattern"
                            }],
                            h: [{
                                value: "h",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "a",
                                type: "pattern"
                            }],
                            hm: [{
                                value: "h",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "a",
                                type: "pattern"
                            }],
                            hms: [{
                                value: "h",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "ss",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "a",
                                type: "pattern"
                            }],
                            ms: [{
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "ss",
                                type: "pattern"
                            }],
                            y: [{
                                value: "y",
                                type: "pattern"
                            }],
                            yM: [{
                                value: "M",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yMEd: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "M",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yMMM: [{
                                value: "MMM",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yMMMEd: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "MMM",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yMMMd: [{
                                value: "MMM",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yMd: [{
                                value: "M",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yQQQ: [{
                                value: "QQQ",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yQQQQ: [{
                                value: "QQQQ",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }]
                        }
                    },
                    date: {
                        "default": [{
                            value: "MMM",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "d",
                            type: "pattern"
                        }, {
                            value: ", ",
                            type: "plaintext"
                        }, {
                            value: "y",
                            type: "pattern"
                        }],
                        full: [{
                            value: "EEEE",
                            type: "pattern"
                        }, {
                            value: ", ",
                            type: "plaintext"
                        }, {
                            value: "MMMM",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "d",
                            type: "pattern"
                        }, {
                            value: ", ",
                            type: "plaintext"
                        }, {
                            value: "y",
                            type: "pattern"
                        }],
                        "long": [{
                            value: "MMMM",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "d",
                            type: "pattern"
                        }, {
                            value: ", ",
                            type: "plaintext"
                        }, {
                            value: "y",
                            type: "pattern"
                        }],
                        medium: [{
                            value: "MMM",
                            type: "pattern"
                        }, {
                            value: " ",
                            type: "plaintext"
                        }, {
                            value: "d",
                            type: "pattern"
                        }, {
                            value: ", ",
                            type: "plaintext"
                        }, {
                            value: "y",
                            type: "pattern"
                        }],
                        "short": [{
                            value: "M",
                            type: "pattern"
                        }, {
                            value: "/",
                            type: "plaintext"
                        }, {
                            value: "d",
                            type: "pattern"
                        }, {
                            value: "/",
                            type: "plaintext"
                        }, {
                            value: "yy",
                            type: "pattern"
                        }],
                        additional: {
                            EHm: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "HH",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }],
                            EHms: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "HH",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "ss",
                                type: "pattern"
                            }],
                            Ed: [{
                                value: "d",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "E",
                                type: "pattern"
                            }],
                            Ehm: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "h",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "a",
                                type: "pattern"
                            }],
                            Ehms: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "h",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "ss",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "a",
                                type: "pattern"
                            }],
                            Gy: [{
                                value: "y",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "G",
                                type: "pattern"
                            }],
                            H: [{
                                value: "HH",
                                type: "pattern"
                            }],
                            Hm: [{
                                value: "HH",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }],
                            Hms: [{
                                value: "HH",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "ss",
                                type: "pattern"
                            }],
                            M: [{
                                value: "L",
                                type: "pattern"
                            }],
                            MEd: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "M",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }],
                            MMM: [{
                                value: "LLL",
                                type: "pattern"
                            }],
                            MMMEd: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "MMM",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }],
                            MMMd: [{
                                value: "MMM",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }],
                            Md: [{
                                value: "M",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }],
                            d: [{
                                value: "d",
                                type: "pattern"
                            }],
                            h: [{
                                value: "h",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "a",
                                type: "pattern"
                            }],
                            hm: [{
                                value: "h",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "a",
                                type: "pattern"
                            }],
                            hms: [{
                                value: "h",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "ss",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "a",
                                type: "pattern"
                            }],
                            ms: [{
                                value: "mm",
                                type: "pattern"
                            }, {
                                value: ":",
                                type: "plaintext"
                            }, {
                                value: "ss",
                                type: "pattern"
                            }],
                            y: [{
                                value: "y",
                                type: "pattern"
                            }],
                            yM: [{
                                value: "M",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yMEd: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "M",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yMMM: [{
                                value: "MMM",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yMMMEd: [{
                                value: "E",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "MMM",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yMMMd: [{
                                value: "MMM",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }, {
                                value: ", ",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yMd: [{
                                value: "M",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "d",
                                type: "pattern"
                            }, {
                                value: "/",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yQQQ: [{
                                value: "QQQ",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }],
                            yQQQQ: [{
                                value: "QQQQ",
                                type: "pattern"
                            }, {
                                value: " ",
                                type: "plaintext"
                            }, {
                                value: "y",
                                type: "pattern"
                            }]
                        }
                    }
                }, this.weekday_keys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"], this.methods = {
                    G: "era",
                    y: "year",
                    Y: "year_of_week_of_year",
                    Q: "quarter",
                    q: "quarter_stand_alone",
                    M: "month",
                    L: "month_stand_alone",
                    w: "week_of_year",
                    W: "week_of_month",
                    d: "day",
                    D: "day_of_month",
                    F: "day_of_week_in_month",
                    E: "weekday",
                    e: "weekday_local",
                    c: "weekday_local_stand_alone",
                    a: "period",
                    h: "hour",
                    H: "hour",
                    K: "hour",
                    k: "hour",
                    m: "minute",
                    s: "second",
                    S: "second_fraction",
                    z: "timezone",
                    Z: "timezone",
                    v: "timezone_generic_non_location",
                    V: "timezone_metazone"
                }
            }
            return b.prototype.format = function(a, b) {
                var c, d, e, f = this;
                return c = function(b) {
                    var c;
                    c = "";
                    switch (b.type) {
                        case "pattern":
                            return f.result_for_token(b, a);
                        default:
                            return b.value.length > 0 && b.value[0] === "'" && b.value[b.value.length - 1] === "'" ? b.value.substring(1, b.value.length - 1) : b.value
                    }
                }, e = this.get_tokens(a, b),
                function() {
                    var a, b, f;
                    f = [];
                    for (a = 0, b = e.length; a < b; a++) d = e[a], f.push(c(d));
                    return f
                }().join("")
            }, b.prototype.get_tokens = function(a, b) {
                var c, d;
                return c = b.format || "date_time", d = b.type || "default", c === "additional" ? this.tokens.date_time[c][this.additional_format_selector().find_closest(b.type)] : this.tokens[c][d]
            }, b.prototype.result_for_token = function(a, b) {
                return this[this.methods[a.value[0]]](b, a.value, a.value.length)
            }, b.prototype.additional_format_selector = function() {
                return new a.AdditionalDateFormatSelector(this.tokens.date_time.additional)
            }, b.additional_formats = function() {
                return (new a.DateTimeFormatter).additional_format_selector().patterns()
            }, b.prototype.era = function(b, c, d) {
                var e, f, g;
                switch (d) {
                    case 0:
                        e = ["", ""];
                        break;
                    case 1:
                    case 2:
                    case 3:
                        e = a.Calendar.calendar.eras.abbr;
                        break;
                    default:
                        e = a.Calendar.calendar.eras.name
                }
                return f = b.getFullYear() < 0 ? 0 : 1, g = e[f], g != null ? g : this.era(b, c.slice(0, -1), d - 1)
            }, b.prototype.year = function(a, b, c) {
                var d;
                return d = a.getFullYear().toString(), c === 2 && d.length !== 1 && (d = d.slice(-2)), c > 1 && (d = ("0000" + d).slice(-c)), d
            }, b.prototype.year_of_week_of_year = function(a, b, c) {
                throw "not implemented"
            }, b.prototype.day_of_week_in_month = function(a, b, c) {
                throw "not implemented"
            }, b.prototype.quarter = function(b, c, d) {
                var e;
                e = (b.getMonth() / 3 | 0) + 1;
                switch (d) {
                    case 1:
                        return e.toString();
                    case 2:
                        return ("0000" + e.toString()).slice(-d);
                    case 3:
                        return a.Calendar.calendar.quarters.format.abbreviated[e];
                    case 4:
                        return a.Calendar.calendar.quarters.format.wide[e]
                }
            }, b.prototype.quarter_stand_alone = function(b, c, d) {
                var e;
                e = (b.getMonth() - 1) / 3 + 1;
                switch (d) {
                    case 1:
                        return e.toString();
                    case 2:
                        return ("0000" + e.toString()).slice(-d);
                    case 3:
                        throw 'not yet implemented (requires cldr\'s "multiple inheritance")';
                    case 4:
                        throw 'not yet implemented (requires cldr\'s "multiple inheritance")';
                    case 5:
                        return a.Calendar.calendar.quarters["stand-alone"].narrow[e]
                }
            }, b.prototype.month = function(b, c, d) {
                var e;
                e = (b.getMonth() + 1).toString();
                switch (d) {
                    case 1:
                        return e;
                    case 2:
                        return ("0000" + e).slice(-d);
                    case 3:
                        return a.Calendar.calendar.months.format.abbreviated[e];
                    case 4:
                        return a.Calendar.calendar.months.format.wide[e];
                    case 5:
                        throw 'not yet implemented (requires cldr\'s "multiple inheritance")';
                    default:
                        throw "Unknown date format"
                }
            }, b.prototype.month_stand_alone = function(b, c, d) {
                var e;
                e = (b.getMonth() + 1).toString();
                switch (d) {
                    case 1:
                        return e;
                    case 2:
                        return ("0000" + e).slice(-d);
                    case 3:
                        return a.Calendar.calendar.months["stand-alone"].abbreviated[e];
                    case 4:
                        return a.Calendar.calendar.months["stand-alone"].wide[e];
                    case 5:
                        return a.Calendar.calendar.months["stand-alone"].narrow[e];
                    default:
                        throw "Unknown date format"
                }
            }, b.prototype.day = function(a, b, c) {
                switch (c) {
                    case 1:
                        return a.getDate().toString();
                    case 2:
                        return ("0000" + a.getDate().toString()).slice(-c)
                }
            }, b.prototype.weekday = function(b, c, d) {
                var e;
                e = this.weekday_keys[b.getDay()];
                switch (d) {
                    case 1:
                    case 2:
                    case 3:
                        return a.Calendar.calendar.days.format.abbreviated[e];
                    case 4:
                        return a.Calendar.calendar.days.format.wide[e];
                    case 5:
                        return a.Calendar.calendar.days["stand-alone"].narrow[e]
                }
            }, b.prototype.weekday_local = function(a, b, c) {
                var d;
                switch (c) {
                    case 1:
                    case 2:
                        return d = a.getDay(), d === 0 ? "7" : d.toString();
                    default:
                        return this.weekday(a, b, c)
                }
            }, b.prototype.weekday_local_stand_alone = function(a, b, c) {
                switch (c) {
                    case 1:
                        return this.weekday_local(a, b, c);
                    default:
                        return this.weekday(a, b, c)
                }
            }, b.prototype.period = function(b, c, d) {
                return b.getHours() > 11 ? a.Calendar.calendar.periods.format.wide.pm : a.Calendar.calendar.periods.format.wide.am
            }, b.prototype.hour = function(a, b, c) {
                var d;
                d = a.getHours();
                switch (b[0]) {
                    case "h":
                        d > 12 ? d -= 12 : d === 0 && (d = 12);
                        break;
                    case "K":
                        d > 11 && (d -= 12);
                        break;
                    case "k":
                        d === 0 && (d = 24)
                }
                return c === 1 ? d.toString() : ("000000" + d.toString()).slice(-c)
            }, b.prototype.minute = function(a, b, c) {
                return c === 1 ? a.getMinutes().toString() : ("000000" + a.getMinutes().toString()).slice(-c)
            }, b.prototype.second = function(a, b, c) {
                return c === 1 ? a.getSeconds().toString() : ("000000" + a.getSeconds().toString()).slice(-c)
            }, b.prototype.second_fraction = function(a, b, c) {
                if (c > 6) throw "can not use the S format with more than 6 digits";
                return ("000000" + Math.round(Math.pow(a.getMilliseconds() * 100, 6 - c)).toString()).slice(-c)
            }, b.prototype.timezone = function(a, b, c) {
                var d, e, f, g, h;
                f = a.getTimezoneOffset(), d = ("00" + (Math.abs(f) / 60).toString()).slice(-2), e = ("00" + (Math.abs(f) % 60).toString()).slice(-2), h = f > 0 ? "-" : "+", g = h + d + ":" + e;
                switch (c) {
                    case 1:
                    case 2:
                    case 3:
                        return g;
                    default:
                        return "UTC" + g
                }
            }, b.prototype.timezone_generic_non_location = function(a, b, c) {
                throw 'not yet implemented (requires timezone translation data")'
            }, b
        }(), a.AdditionalDateFormatSelector = function() {
            function a(a) {
                this.pattern_hash = a
            }
            return a.prototype.find_closest = function(a) {
                var b, c, d, e, f;
                if (a == null || a.trim().length === 0) return null;
                f = this.rank(a), d = 100, c = null;
                for (b in f) e = f[b], e < d && (d = e, c = b);
                return c
            }, a.prototype.patterns = function() {
                var a, b;
                b = [];
                for (a in this.pattern_hash) b.push(a);
                return b
            }, a.prototype.separate = function(a) {
                var b, c, d, e, f;
                c = "", d = [];
                for (e = 0, f = a.length; e < f; e++) b = a[e], b === c ? d[d.length - 1] += b : d.push(b), c = b;
                return d
            }, a.prototype.all_separated_patterns = function() {
                var a, b;
                b = [];
                for (a in this.pattern_hash) b.push(this.separate(a));
                return b
            }, a.prototype.score = function(a, b) {
                var c;
                return c = this.exist_score(a, b) * 2, c += this.position_score(a, b), c + this.count_score(a, b)
            }, a.prototype.position_score = function(a, b) {
                var c, d, e, f;
                f = 0;
                for (e in b) d = b[e], c = a.indexOf(d), c > -1 && (f += Math.abs(c - e));
                return f
            }, a.prototype.exist_score = function(a, b) {
                var c, d, e, f, g;
                c = 0;
                for (f = 0, g = b.length; f < g; f++) e = b[f],
                function() {
                    var b, c, f;
                    f = [];
                    for (b = 0, c = a.length; b < c; b++) d = a[b], d[0] === e[0] && f.push(d);
                    return f
                }().length > 0 || (c += 1);
                return c
            }, a.prototype.count_score = function(a, b) {
                var c, d, e, f, g, h;
                f = 0;
                for (g = 0, h = b.length; g < h; g++) e = b[g], d = function() {
                    var b, d, f;
                    f = [];
                    for (b = 0, d = a.length; b < d; b++) c = a[b], c[0] === e[0] && f.push(c);
                    return f
                }()[0], d != null && (f += Math.abs(d.length - e.length));
                return f
            }, a.prototype.rank = function(a) {
                var b, c, d, e, f, g;
                c = this.separate(a), b = {}, g = this.all_separated_patterns();
                for (e = 0, f = g.length; e < f; e++) d = g[e], b[d.join("")] = this.score(d, c);
                return b
            }, a
        }(), a.Calendar = function() {
            function a() {}
            return a.calendar = {
                additional_formats: {
                    EHm: "E HH:mm",
                    EHms: "E HH:mm:ss",
                    Ed: "d E",
                    Ehm: "E h:mm a",
                    Ehms: "E h:mm:ss a",
                    Gy: "y G",
                    H: "HH",
                    Hm: "HH:mm",
                    Hms: "HH:mm:ss",
                    M: "L",
                    MEd: "E, M/d",
                    MMM: "LLL",
                    MMMEd: "E, MMM d",
                    MMMd: "MMM d",
                    Md: "M/d",
                    d: "d",
                    h: "h a",
                    hm: "h:mm a",
                    hms: "h:mm:ss a",
                    ms: "mm:ss",
                    y: "y",
                    yM: "M/y",
                    yMEd: "E, M/d/y",
                    yMMM: "MMM y",
                    yMMMEd: "E, MMM d, y",
                    yMMMd: "MMM d, y",
                    yMd: "M/d/y",
                    yQQQ: "QQQ y",
                    yQQQQ: "QQQQ y"
                },
                days: {
                    format: {
                        abbreviated: {
                            fri: "Fri",
                            mon: "Mon",
                            sat: "Sat",
                            sun: "Sun",
                            thu: "Thu",
                            tue: "Tue",
                            wed: "Wed"
                        },
                        narrow: {
                            fri: "F",
                            mon: "M",
                            sat: "S",
                            sun: "S",
                            thu: "T",
                            tue: "T",
                            wed: "W"
                        },
                        "short": {
                            fri: "Fr",
                            mon: "Mo",
                            sat: "Sa",
                            sun: "Su",
                            thu: "Th",
                            tue: "Tu",
                            wed: "We"
                        },
                        wide: {
                            fri: "Friday",
                            mon: "Monday",
                            sat: "Saturday",
                            sun: "Sunday",
                            thu: "Thursday",
                            tue: "Tuesday",
                            wed: "Wednesday"
                        }
                    },
                    "stand-alone": {
                        abbreviated: {
                            fri: "Fri",
                            mon: "Mon",
                            sat: "Sat",
                            sun: "Sun",
                            thu: "Thu",
                            tue: "Tue",
                            wed: "Wed"
                        },
                        narrow: {
                            fri: "F",
                            mon: "M",
                            sat: "S",
                            sun: "S",
                            thu: "T",
                            tue: "T",
                            wed: "W"
                        },
                        "short": {
                            fri: "Fr",
                            mon: "Mo",
                            sat: "Sa",
                            sun: "Su",
                            thu: "Th",
                            tue: "Tu",
                            wed: "We"
                        },
                        wide: {
                            fri: "Friday",
                            mon: "Monday",
                            sat: "Saturday",
                            sun: "Sunday",
                            thu: "Thursday",
                            tue: "Tuesday",
                            wed: "Wednesday"
                        }
                    }
                },
                eras: {
                    abbr: {
                        0: "BC",
                        1: "AD"
                    },
                    name: {
                        0: "Before Christ",
                        1: "Anno Domini"
                    },
                    narrow: {
                        0: "B",
                        1: "A"
                    }
                },
                fields: {
                    day: "Day",
                    dayperiod: "AM/PM",
                    era: "Era",
                    hour: "Hour",
                    minute: "Minute",
                    month: "Month",
                    second: "Second",
                    week: "Week",
                    weekday: "Day of the Week",
                    year: "Year",
                    zone: "Time Zone"
                },
                formats: {
                    date: {
                        "default": {
                            pattern: "MMM d, y"
                        },
                        full: {
                            pattern: "EEEE, MMMM d, y"
                        },
                        "long": {
                            pattern: "MMMM d, y"
                        },
                        medium: {
                            pattern: "MMM d, y"
                        },
                        "short": {
                            pattern: "M/d/yy"
                        }
                    },
                    datetime: {
                        "default": {
                            pattern: "{{date}}, {{time}}"
                        },
                        full: {
                            pattern: "{{date}} 'at' {{time}}"
                        },
                        "long": {
                            pattern: "{{date}} 'at' {{time}}"
                        },
                        medium: {
                            pattern: "{{date}}, {{time}}"
                        },
                        "short": {
                            pattern: "{{date}}, {{time}}"
                        }
                    },
                    time: {
                        "default": {
                            pattern: "h:mm:ss a"
                        },
                        full: {
                            pattern: "h:mm:ss a zzzz"
                        },
                        "long": {
                            pattern: "h:mm:ss a z"
                        },
                        medium: {
                            pattern: "h:mm:ss a"
                        },
                        "short": {
                            pattern: "h:mm a"
                        }
                    }
                },
                months: {
                    format: {
                        abbreviated: {
                            1: "Jan",
                            10: "Oct",
                            11: "Nov",
                            12: "Dec",
                            2: "Feb",
                            3: "Mar",
                            4: "Apr",
                            5: "May",
                            6: "Jun",
                            7: "Jul",
                            8: "Aug",
                            9: "Sep"
                        },
                        narrow: {
                            1: "J",
                            10: "O",
                            11: "N",
                            12: "D",
                            2: "F",
                            3: "M",
                            4: "A",
                            5: "M",
                            6: "J",
                            7: "J",
                            8: "A",
                            9: "S"
                        },
                        wide: {
                            1: "January",
                            10: "October",
                            11: "November",
                            12: "December",
                            2: "February",
                            3: "March",
                            4: "April",
                            5: "May",
                            6: "June",
                            7: "July",
                            8: "August",
                            9: "September"
                        }
                    },
                    "stand-alone": {
                        abbreviated: {
                            1: "Jan",
                            10: "Oct",
                            11: "Nov",
                            12: "Dec",
                            2: "Feb",
                            3: "Mar",
                            4: "Apr",
                            5: "May",
                            6: "Jun",
                            7: "Jul",
                            8: "Aug",
                            9: "Sep"
                        },
                        narrow: {
                            1: "J",
                            10: "O",
                            11: "N",
                            12: "D",
                            2: "F",
                            3: "M",
                            4: "A",
                            5: "M",
                            6: "J",
                            7: "J",
                            8: "A",
                            9: "S"
                        },
                        wide: {
                            1: "January",
                            10: "October",
                            11: "November",
                            12: "December",
                            2: "February",
                            3: "March",
                            4: "April",
                            5: "May",
                            6: "June",
                            7: "July",
                            8: "August",
                            9: "September"
                        }
                    }
                },
                periods: {
                    format: {
                        abbreviated: null,
                        narrow: {
                            am: "a",
                            noon: "n",
                            pm: "p"
                        },
                        wide: {
                            am: "a.m.",
                            noon: "noon",
                            pm: "p.m."
                        }
                    },
                    "stand-alone": {}
                },
                quarters: {
                    format: {
                        abbreviated: {
                            1: "Q1",
                            2: "Q2",
                            3: "Q3",
                            4: "Q4"
                        },
                        narrow: {
                            1: 1,
                            2: 2,
                            3: 3,
                            4: 4
                        },
                        wide: {
                            1: "1st quarter",
                            2: "2nd quarter",
                            3: "3rd quarter",
                            4: "4th quarter"
                        }
                    },
                    "stand-alone": {
                        abbreviated: {
                            1: "Q1",
                            2: "Q2",
                            3: "Q3",
                            4: "Q4"
                        },
                        narrow: {
                            1: 1,
                            2: 2,
                            3: 3,
                            4: 4
                        },
                        wide: {
                            1: "1st quarter",
                            2: "2nd quarter",
                            3: "3rd quarter",
                            4: "4th quarter"
                        }
                    }
                }
            }, a.months = function(a) {
                var b, c, d, e;
                a == null && (a = {}), d = this.get_root("months", a), c = [];
                for (b in d) e = d[b], c[parseInt(b) - 1] = e;
                return c
            }, a.weekdays = function(a) {
                return a == null && (a = {}), this.get_root("days", a)
            }, a.get_root = function(a, b) {
                var c, d, e, f;
                return b == null && (b = {}), e = this.calendar[a], d = b.names_form || "wide", c = b.format || ((e != null ? (f = e["stand-alone"]) != null ? f[d] : void 0 : void 0) != null ? "stand-alone" : "format"), e[c][d]
            }, a
        }(), d = typeof exports != "undefined" && exports !== null ? exports : (this.TwitterCldr = {}, this.TwitterCldr);
        for (b in a) c = a[b], d[b] = c
    }).call(this)
});