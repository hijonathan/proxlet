define("app/data/trends", ["module", "require", "exports", "core/component", "core/clock", "app/utils/setup_polling_with_backoff", "app/data/with_data"], function(module, require, exports) {
    function trendsData() {
        this.defaultAttrs({
            src: "module",
            $backoffNode: $(window),
            trendsPollingOptions: {
                focusedInterval: 3e5,
                blurredInterval: 12e5,
                eventData: {
                    source: "clock"
                }
            }
        }), this.makeTrendsRequest = function(a) {
            var b = a.woeid,
                c = a.source,
                d = function(a) {
                    a.source = c, this.trigger("dataTrendsRefreshed", a)
                };
            this.get({
                url: "/trends",
                eventData: a,
                data: {
                    k: this.currentCacheKey,
                    woeid: b,
                    pc: !0,
                    personalized: a.personalized,
                    src: this.attr.src
                },
                success: d.bind(this),
                error: "dataTrendsRefreshedError"
            })
        }, this.makeTrendsDialogRequest = function(a, b) {
            var c = {
                woeid: a.woeid,
                personalized: a.personalized,
                pc: !0
            }, d = function(a) {
                this.trigger("dataGotTrendsDialog", a), this.currentWoeid && this.currentWoeid !== a.woeid && this.trigger("dataTrendsLocationChanged"), this.currentWoeid = a.woeid, a.trends_cache_key && (this.currentCacheKey = a.trends_cache_key, this.trigger("dataPageMutated")), a.module_html && this.trigger("dataTrendsRefreshed", a)
            }, e = b ? this.post : this.get;
            e.call(this, {
                url: "/trends/dialog",
                eventData: a,
                data: c,
                success: d.bind(this),
                error: "dataGotTrendsDialogError"
            })
        }, this.changeTrendsLocation = function(a, b) {
            this.makeTrendsDialogRequest(b, !0)
        }, this.refreshTrends = function(a, b) {
            b = b || {}, this.makeTrendsRequest(b)
        }, this.getTrendsDialog = function(a, b) {
            b = b || {}, this.makeTrendsDialogRequest(b)
        }, this.after("initialize", function(a) {
            this.currentCacheKey = a.trendsCacheKey, this.timer = setupPollingWithBackoff("uiRefreshTrends", this.attr.$backoffNode, this.attr.trendsPollingOptions), this.on("uiWantsTrendsDialog", this.getTrendsDialog), this.on("uiChangeTrendsLocation", this.changeTrendsLocation), this.on("uiRefreshTrends", this.refreshTrends)
        })
    }
    var defineComponent = require("core/component"),
        clock = require("core/clock"),
        setupPollingWithBackoff = require("app/utils/setup_polling_with_backoff"),
        withData = require("app/data/with_data");
    module.exports = defineComponent(trendsData, withData)
});
define("app/utils/scribe_event_initiators", ["module", "require", "exports"], function(module, require, exports) {
    module.exports = {
        clientSideUser: 0,
        serverSideUser: 1,
        clientSideApp: 2,
        serverSideApp: 3
    }
});
define("app/data/trends_scribe", ["module", "require", "exports", "core/component", "app/data/with_scribe", "app/utils/scribe_item_types", "app/utils/scribe_event_initiators"], function(module, require, exports) {
    function trendsScribe() {
        this.scribeTrendClick = function(a, b) {
            this.scribe("search", b)
        }, this.scribeTrendsResults = function(a, b) {
            var c = [],
                d = b.initial ? "initial" : "newer",
                e = {
                    element: d,
                    action: b.items && b.items.length ? "results" : "no_results"
                }, f = {
                    referring_event: d
                }, g = !1;
            f.items = b.items.map(function(a, b) {
                var c = {
                    name: a.name,
                    item_type: itemTypes.trend,
                    item_query: a.name,
                    position: b
                };
                return a.promotedTrendId && (c.promoted_id = a.promotedTrendId, g = !0), c
            }), g && (f.promoted = g), b.source === "clock" && (f.event_initiator = eventInitiators.clientSideApp), this.scribe(e, b, f), b.initial && this.scribeTrendsImpression(b)
        }, this.scribeTrendsImpression = function(a) {
            this.scribe("impression", a)
        }, this.after("initialize", function() {
            this.scribeOnEvent("uiTrendsDialogOpened", "open"), this.on("uiTrendSelected", this.scribeTrendClick), this.on("uiTrendsDisplayed", this.scribeTrendsResults)
        })
    }
    var defineComponent = require("core/component"),
        withScribe = require("app/data/with_scribe"),
        itemTypes = require("app/utils/scribe_item_types"),
        eventInitiators = require("app/utils/scribe_event_initiators");
    module.exports = defineComponent(trendsScribe, withScribe)
});
define("app/ui/trends/trends", ["module", "require", "exports", "core/component", "app/data/ddg", "app/utils/scribe_item_types", "app/ui/with_tweet_actions", "app/ui/with_item_actions"], function(module, require, exports) {
    function trendsModule() {
        this.defaultAttrs({
            changeLinkSelector: ".change-trends",
            trendsInnerSelector: ".trends-inner",
            trendItemSelector: ".js-trend-item",
            promotedTweetProofSelector: ".tweet-proof-container.promoted-tweet",
            trendLinkItemSelector: ".js-trend-item a",
            eventTrendClass: "event-trend",
            itemType: "trend"
        }), this.openChangeTrendsDialog = function(a) {
            this.trigger("uiShowTrendsLocationDialog"), a.preventDefault()
        }, this.updateModuleContent = function(a, b) {
            var c = this.$node.hasClass("hidden"),
                d = b.source;
            this.select("trendsInnerSelector").html(b.module_html), this.currentWoeid = b.woeid, this.$node.removeClass("hidden");
            var e = this.getTrendData(this.select("trendItemSelector"));
            this.trigger("uiTrendsDisplayed", {
                items: e,
                initial: c,
                source: d,
                scribeData: {
                    woeid: this.currentWoeid
                }
            });
            var f = this.getPromotedTweetProofData(this.select("promotedTweetProofSelector"));
            this.trigger("uiTweetsDisplayed", {
                tweets: f
            })
        }, this.trendSelected = function(a, b) {
            var c = $(b.el).closest(this.attr.trendItemSelector),
                d = this.getTrendData(c)[0],
                e = c.index(),
                f = {
                    name: d.name,
                    item_query: d.name,
                    position: e,
                    item_type: itemTypes.trend
                }, g = {
                    position: e,
                    query: d.name,
                    url: c.find("a").attr("href"),
                    woeid: this.currentWoeid
                };
            d.promotedTrendId && (f.promoted_id = d.promotedTrendId, g.promoted = !0), g.items = [f], this.trigger("uiTrendSelected", {
                isPromoted: !! d.promotedTrendId,
                promotedTrendId: d.promotedTrendId,
                scribeContext: {
                    element: "trend"
                },
                scribeData: g
            }), this.trackTrendSelected( !! d.promotedTrendId, c.hasClass(this.attr.eventTrendClass))
        }, this.trackTrendSelected = function(a, b) {
            var c = b ? "event_trend_click" : a ? "promoted_trend_click" : "trend_click";
            ddg.track("olympic_trends_320", c)
        }, this.getTrendData = function(a) {
            return a.map(function() {
                var a = $(this);
                return {
                    name: a.data("trend-name"),
                    promotedTrendId: a.data("promoted-trend-id"),
                    trendingEvent: a.hasClass("event-trend")
                }
            }).toArray()
        }, this.getPromotedTweetProofData = function(a) {
            return a.map(function(a, b) {
                return {
                    impressionId: $(b).data("impression-id")
                }
            }).toArray()
        }, this.after("initialize", function() {
            this.on(document, "dataTrendsRefreshed", this.updateModuleContent), this.on("click", {
                changeLinkSelector: this.openChangeTrendsDialog,
                trendLinkItemSelector: this.trendSelected
            }), this.trigger("uiRefreshTrends")
        })
    }
    var defineComponent = require("core/component"),
        ddg = require("app/data/ddg"),
        itemTypes = require("app/utils/scribe_item_types"),
        withTweetActions = require("app/ui/with_tweet_actions"),
        withItemActions = require("app/ui/with_item_actions");
    module.exports = defineComponent(trendsModule, withTweetActions, withItemActions)
});
define("app/ui/trends/trends_dialog", ["module", "require", "exports", "core/component", "app/ui/with_dialog", "app/ui/with_position", "core/i18n"], function(module, require, exports) {
    function trendsDialog() {
        this.defaultAttrs({
            contentSelector: "#trends_dialog_content",
            trendItemSelector: ".js-trend-link",
            toggleSelector: ".customize-by-location",
            personalizedSelector: ".trends-personalized",
            byLocationSelector: ".trends-by-location",
            doneSelector: ".done",
            selectPersonalizedSelector: ".select-personalized",
            errorSelector: ".trends-dialog-error p",
            loadingSelector: ".loading",
            deciderPersonalizedTrends: !1
        }), this.openTrendsDialog = function(a, b) {
            this.trigger("uiTrendsDialogOpened"), this.hasContent() ? this.selectActiveView() : this.trigger("uiWantsTrendsDialog"), this.$node.removeClass("has-error"), this.open()
        }, this.showPersonalizedView = function() {
            this.select("byLocationSelector").hide(), this.select("personalizedSelector").show()
        }, this.showLocationView = function() {
            this.select("personalizedSelector").hide(), this.select("byLocationSelector").show()
        }, this.updateDialogContent = function(a, b) {
            var c = this.personalized && b.personalized;
            this.personalized = b.personalized, this.currentWoeid = b.woeid;
            if (c && !this.hasError()) return;
            this.select("contentSelector").html(b.dialog_html), this.selectActiveView(), !b.personalized && this.markSelected(b.woeid)
        }, this.selectActiveView = function() {
            this.isPersonalized() ? this.showPersonalizedView() : this.showLocationView()
        }, this.showError = function(a, b) {
            this.select("byLocationSelector").hide(), this.select("personalizedSelector").hide(), this.$node.addClass("has-error"), this.select("errorSelector").html(b.message)
        }, this.hasContent = function() {
            return this.select("loadingSelector").length == 0 && !this.hasError()
        }, this.hasError = function() {
            return this.$node.hasClass("has-error")
        }, this.markSelected = function(a) {
            this.select("trendItemSelector").removeClass("selected").filter("[data-woeid=" + a + "]").addClass("selected")
        }, this.clearSelectedBreadcrumb = function() {
            this.select("selectedBreadCrumbSelector").removeClass("checkmark")
        }, this.changeSelectedItem = function(a, b) {
            var c = $(b.el).data("woeid");
            if (this.isPersonalized() || c !== this.currentWoeid) this.markSelected(c), this.trigger("uiChangeTrendsLocation", {
                woeid: c
            });
            a.preventDefault()
        }, this.selectPersonalized = function(a, b) {
            this.trigger("uiChangeTrendsLocation", {
                personalized: !0
            }), this.close()
        }, this.toggleView = function(a, b) {
            this.select("personalizedSelector").is(":visible") ? this.showLocationView() : this.showPersonalizedView()
        }, this.isPersonalized = function() {
            return this.attr.deciderPersonalizedTrends && this.personalized
        }, this.after("initialize", function() {
            this.select("byLocationSelector").hide(), this.select("personalizedSelector").hide(), this.on(document, "uiShowTrendsLocationDialog", this.openTrendsDialog), this.on(document, "dataGotTrendsDialog", this.updateDialogContent), this.on(document, "dataGotTrendsDialogError", this.showError), this.on("click", {
                trendItemSelector: this.changeSelectedItem,
                toggleSelector: this.toggleView,
                doneSelector: this.close,
                selectPersonalizedSelector: this.selectPersonalized
            })
        })
    }
    var defineComponent = require("core/component"),
        withDialog = require("app/ui/with_dialog"),
        withPosition = require("app/ui/with_position"),
        _ = require("core/i18n");
    module.exports = defineComponent(trendsDialog, withDialog, withPosition)
});
define("app/boot/trends", ["module", "require", "exports", "app/data/trends", "app/data/trends_scribe", "app/ui/trends/trends", "app/ui/trends/trends_dialog"], function(module, require, exports) {
    var TrendsData = require("app/data/trends"),
        TrendsScribe = require("app/data/trends_scribe"),
        TrendsModule = require("app/ui/trends/trends"),
        TrendsDialog = require("app/ui/trends/trends_dialog");
    module.exports = function(b) {
        TrendsData.attachTo(document, b), TrendsScribe.attachTo(document, b), TrendsModule.attachTo(".module.trends", {
            loggedIn: b.loggedIn,
            eventData: {
                scribeContext: {
                    component: "trends"
                }
            }
        }), TrendsDialog.attachTo("#trends_dialog", {
            deciderPersonalizedTrends: b.decider_personalized_trends,
            eventData: {
                scribeContext: {
                    component: "trends_dialog"
                }
            }
        })
    }
});
define("app/ui/infinite_scroll_watcher", ["module", "require", "exports", "core/component", "core/utils"], function(module, require, exports) {
    function infiniteScrollWatcher() {
        var a = 0,
            b = 1;
        this.checkScrollPosition = function() {
            var c = this.$content.height(),
                d = !1;
            this.inTriggerRange(a) && (c > this.lastTriggeredHeight || this.lastTriggeredFrom(b)) ? (this.trigger("uiNearTheTop"), this.lastTriggerFrom = a, d = !0) : this.inTriggerRange(b) && (c > this.lastTriggeredHeight || this.lastTriggeredFrom(a)) && (this.trigger("uiNearTheBottom"), this.lastTriggerFrom = b, d = !0), d && (this.lastTriggeredHeight = c)
        }, this.inTriggerRange = function(c) {
            var d = this.$content.height(),
                e = this.$node.scrollTop(),
                f = e + this.$node.height(),
                g = Math.abs(Math.min(f - d, 0)),
                h = this.$node.height() / 2;
            return e < h && c == a || g < h && c == b
        }, this.lastTriggeredFrom = function(a) {
            return this.lastTriggerFrom === a
        }, this.resetScrollState = function() {
            this.lastTriggeredHeight = 0, this.lastTriggerFrom = -1
        }, this.after("initialize", function(a) {
            this.resetScrollState(), this.$content = a.contentSelector ? this.select("contentSelector") : $(document), this.on("scroll", utils.throttle(this.checkScrollPosition.bind(this), 100)), this.on("uiTimelineReset", this.resetScrollState)
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        InfiniteScrollWatcher = defineComponent(infiniteScrollWatcher);
    module.exports = InfiniteScrollWatcher
});
define("app/data/timeline", ["module", "require", "exports", "core/component", "core/utils", "app/data/with_data"], function(module, require, exports) {
    function timeline() {
        this.defaultAttrs({
            defaultAjaxData: {
                include_entities: 1,
                include_available_features: 1
            },
            noShowError: !0
        }), this.requestItems = function(a, b) {
            var c = function(b) {
                this.trigger(a.target, "dataGotMoreTimelineItems", b)
            }, d = function(b) {
                this.trigger(a.target, "dataGotMoreTimelineItemsError", b)
            }, e = {};
            b && b.fromPolling && (e["X-Twitter-Polling"] = !0);
            var f = {
                since_id: b.since_id,
                max_id: b.max_id,
                cursor: b.cursor,
                is_forward: b.is_forward,
                latent_count: b.latent_count,
                composed_count: b.composed_count,
                include_new_items_bar: b.include_new_items_bar,
                preexpanded_id: b.preexpanded_id,
                interval: b.interval,
                count: b.count
            };
            b.query && (f.q = b.query), b.curated_timeline_since_id && (f.curated_timeline_since_id = b.curated_timeline_since_id), b.scroll_cursor && (f.scroll_cursor = b.scroll_cursor), b.refresh_cursor && (f.refresh_cursor = b.refresh_cursor), this.get({
                url: this.attr.endpoint,
                headers: e,
                data: utils.merge(this.attr.defaultAjaxData, f),
                eventData: b,
                success: c.bind(this),
                error: d.bind(this)
            })
        }, this.after("initialize", function(a) {
            this.on("uiWantsMoreTimelineItems", this.requestItems)
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        withData = require("app/data/with_data");
    module.exports = defineComponent(timeline, withData)
});
define("app/boot/timeline", ["module", "require", "exports", "app/ui/infinite_scroll_watcher", "app/data/timeline"], function(module, require, exports) {
    function initialize(a) {
        a.no_global_infinite_scroll || InfiniteScrollWatcher.attachTo(window), TimelineData.attachTo(document, a)
    }
    var InfiniteScrollWatcher = require("app/ui/infinite_scroll_watcher"),
        TimelineData = require("app/data/timeline");
    module.exports = initialize
});
define("app/data/activity_popup", ["module", "require", "exports", "core/component", "app/data/with_data"], function(module, require, exports) {
    function activityPopupData() {
        this.defaultAttrs({
            noShowError: !0
        }), this.getUsers = function(a, b) {
            var c = b.isRetweeted ? "/i/activity/retweeted_popup" : "/i/activity/favorited_popup";
            this.get({
                url: c,
                data: {
                    id: b.tweetId
                },
                eventData: b,
                success: "dataActivityPopupSuccess",
                error: "dataActivityPopupError"
            })
        }, this.after("initialize", function() {
            this.on("uiFetchActivityPopup", this.getUsers)
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data");
    module.exports = defineComponent(activityPopupData, withData)
});
define("app/ui/dialogs/activity_popup", ["module", "require", "exports", "core/component", "core/i18n", "core/utils", "app/ui/with_position", "app/ui/with_dialog", "app/ui/with_user_actions", "app/ui/with_item_actions"], function(module, require, exports) {
    function activityPopup() {
        this.defaultAttrs({
            itemType: "user",
            titleSelector: ".modal-title",
            tweetSelector: ".activity-tweet",
            contentSelector: ".activity-content",
            openDropdownSelector: ".user-dropdown.open .dropdown-menu",
            usersSelector: ".activity-popup-users"
        }), this.setTitle = function(a) {
            this.select("titleSelector").html(a)
        }, this.setContent = function(a) {
            this.$node.toggleClass("has-content", !! a), this.select("contentSelector").html(a)
        }, this.requestPopup = function(a, b) {
            this.attr.eventData = utils.merge(this.attr.eventData, {
                scribeContext: {
                    component: b.isRetweeted ? "retweeted_dialog" : "favorited_dialog"
                }
            }, !0), this.setTitle(b.titleHtml);
            var c = $(b.tweetHtml);
            this.select("tweetSelector").html(c), this.setContent(""), this.open(), this.trigger("uiFetchActivityPopup", {
                tweetId: c.attr("data-tweet-id"),
                isRetweeted: b.isRetweeted
            })
        }, this.updateUsers = function(a, b) {
            this.setTitle(b.htmlTitle), this.setContent(b.htmlUsers);
            var c = this.select("usersSelector");
            c.height() >= parseInt(c.css("max-height"), 10) && c.addClass("dropdown-threshold")
        }, this.showError = function(a, b) {
            this.setContent($("<p>").addClass("error").html(b.message))
        }, this.after("initialize", function() {
            this.on(document, "uiRequestActivityPopup", this.requestPopup), this.on(document, "dataActivityPopupSuccess", this.updateUsers), this.on(document, "dataActivityPopupError", this.showError), this.on(document, "uiShowProfilePopup uiOpenTweetDialogWithOptions uiOpenDMConversation uiOpenSigninOrSignupDialog", this.close)
        })
    }
    var defineComponent = require("core/component"),
        _ = require("core/i18n"),
        utils = require("core/utils"),
        withPosition = require("app/ui/with_position"),
        withDialog = require("app/ui/with_dialog"),
        withUserActions = require("app/ui/with_user_actions"),
        withItemActions = require("app/ui/with_item_actions");
    module.exports = defineComponent(activityPopup, withDialog, withPosition, withUserActions, withItemActions)
});
define("app/data/activity_popup_scribe", ["module", "require", "exports", "core/component", "app/data/with_scribe"], function(module, require, exports) {
    function activityPopupScribe() {
        this.scribeActivityPopupOpen = function(a, b) {
            var c = b.sourceEventData;
            this.scribe("open", b, {
                item_ids: [c.tweetId],
                item_count: 1
            })
        }, this.after("initialize", function() {
            this.on(document, "dataActivityPopupSuccess", this.scribeActivityPopupOpen)
        })
    }
    var defineComponent = require("core/component"),
        withScribe = require("app/data/with_scribe");
    module.exports = defineComponent(activityPopupScribe, withScribe)
});
define("app/boot/activity_popup", ["module", "require", "exports", "app/data/activity_popup", "app/ui/dialogs/activity_popup", "app/data/activity_popup_scribe"], function(module, require, exports) {
    function initialize(a) {
        ActivityPopupData.attachTo(document, a), ActivityPopupScribe.attachTo(document, a), ActivityPopup.attachTo(activityPopupSelector, a)
    }
    var ActivityPopupData = require("app/data/activity_popup"),
        ActivityPopup = require("app/ui/dialogs/activity_popup"),
        ActivityPopupScribe = require("app/data/activity_popup_scribe"),
        activityPopupSelector = "#activity-popup-dialog";
    module.exports = initialize
});
define("app/data/tweet_translation", ["module", "require", "exports", "core/component", "app/data/with_data"], function(module, require, exports) {
    function tweetTranslation() {
        this.getTweetTranslation = function(a, b) {
            var c = function(a) {
                a && a.message && this.trigger("uiShowMessage", {
                    message: a.message
                }), this.trigger("dataTweetTranslationSuccess", a)
            }, d = function(a, c, d) {
                this.trigger("dataTweetTranslationError", {
                    id: b.id,
                    status: c,
                    errorThrown: d
                })
            }, e = {
                id: b.tweetId,
                dest: b.dest
            };
            this.get({
                url: "/i/translations/show.json",
                data: e,
                headers: {
                    "X-Phx": !0
                },
                eventData: b,
                success: c.bind(this),
                error: d.bind(this)
            })
        }, this.after("initialize", function() {
            this.on("uiNeedsTweetTranslation", this.getTweetTranslation)
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data"),
        TweetTranslation = defineComponent(tweetTranslation, withData);
    module.exports = TweetTranslation
});
define("app/data/conversations", ["module", "require", "exports", "core/component", "app/data/with_data"], function(module, require, exports) {
    function conversations() {
        this.requestExpansion = function(a, b) {
            var c = function(b) {
                this.trigger(a.target, "dataTweetConversationResult", b), this.trigger(a.target, "dataTweetSocialProofResult", b)
            }, d = function(b, c, d) {
                this.trigger(a.target, "dataTweetExpansionError", {
                    status: c,
                    errorThrown: d
                })
            }, e = ["social_proof"];
            b.fullConversation && e.push("ancestors", "descendants");
            var f = {
                include: e
            };
            b.facepileMax && (f.facepile_max = b.facepileMax);
            var g = window.location.search.match(/[?&]js_maps=([^&]+)/);
            g && (f.js_maps = g[1]), this.get({
                url: "/i/expanded/batch/" + encodeURIComponent($(a.target).attr("data-tweet-id")),
                data: f,
                eventData: b,
                success: c.bind(this),
                error: d.bind(this)
            })
        }, this.after("initialize", function() {
            this.on("uiNeedsTweetExpandedContent", this.requestExpansion)
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data"),
        Conversations = defineComponent(conversations, withData);
    module.exports = Conversations
});
define("app/data/media_settings", ["module", "require", "exports", "core/component", "app/data/with_data", "core/i18n"], function(module, require, exports) {
    function mediaSettings() {
        this.flagMedia = function(a, b) {
            this.post({
                url: "/i/expanded/flag_possibly_sensitive",
                eventData: b,
                data: b,
                success: "dataFlaggedMediaResult",
                error: "dataFlaggedMediaError"
            })
        }, this.updateViewPossiblySensitive = function(a, b) {
            this.post({
                url: "/i/expanded/update_view_possibly_sensitive",
                eventData: b,
                data: b,
                success: "dataUpdatedViewPossiblySensitiveResult",
                error: "dataUpdatedViewPossiblySensitiveError"
            })
        }, this.after("initialize", function() {
            this.on("uiFlagMedia", this.flagMedia), this.on("uiUpdateViewPossiblySensitive", this.updateViewPossiblySensitive), this.on("dataUpdatedViewPossiblySensitiveResult", function() {
                this.trigger("uiShowMessage", {
                    message: _('Your media display settings have been changed.')
                })
            }), this.on("dataUpdatedViewPossiblySensitiveError", function() {
                this.trigger("uiShowError", {
                    message: _('Couldn\'t set inline media settings.')
                })
            })
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data"),
        _ = require("core/i18n");
    module.exports = defineComponent(mediaSettings, withData)
});
define("app/ui/dialogs/sensitive_flag_confirmation", ["module", "require", "exports", "core/component", "app/ui/with_dialog", "app/ui/with_position"], function(module, require, exports) {
    function flagDialog() {
        this.defaultAttrs({
            dialogSelector: "#sensitive_flag_dialog",
            cancelSelector: "#cancel_flag_confirmation",
            submitSelector: "#submit_flag_confirmation",
            settingsSelector: "#sensitive-settings-checkbox",
            illegalSelector: "#sensitive-illegal-checkbox"
        }), this.flag = function() {
            this.select("settingsSelector").attr("checked") && this.trigger("uiUpdateViewPossiblySensitive", {
                do_show: !1
            }), this.select("illegalSelector").attr("checked") && this.trigger("uiFlagMedia", {
                id: this.$dialog.attr("data-tweet-id")
            }), this.close()
        }, this.openWithId = function(b, c) {
            this.$dialog.attr("data-tweet-id", c.id), this.open()
        }, this.after("initialize", function(a) {
            this.$dialog = this.select("dialogSelector"), this.on(document, "uiFlagConfirmation", this.openWithId), this.on("click", {
                submitSelector: this.flag,
                cancelSelector: this.close
            })
        })
    }
    var defineComponent = require("core/component"),
        withDialog = require("app/ui/with_dialog"),
        withPosition = require("app/ui/with_position");
    module.exports = defineComponent(flagDialog, withDialog, withPosition)
});
define("app/ui/user_actions", ["module", "require", "exports", "core/component", "app/ui/with_user_actions"], function(module, require, exports) {
    function userActions() {}
    var defineComponent = require("core/component"),
        withUserActions = require("app/ui/with_user_actions");
    module.exports = defineComponent(userActions, withUserActions)
});
define("app/boot/tweets", ["module", "require", "exports", "app/boot/activity_popup", "app/data/tweet_actions", "app/data/tweet_translation", "app/data/conversations", "app/data/media_settings", "app/ui/dialogs/sensitive_flag_confirmation", "app/ui/expando/expanding_tweets", "app/ui/media/media_tweets", "app/data/url_resolver", "app/ui/user_actions", "core/utils"], function(module, require, exports) {
    function initialize(a, b) {
        activityPopupBoot(b), TweetActionsData.attachTo(document, b), TweetTranslationData.attachTo(document, b), ConversationsData.attachTo(document, b), MediaSettingsData.attachTo(document, b), UrlResolver.attachTo(document), ExpandingTweets.attachTo(a, b), UserActions.attachTo(a, utils.merge(b, {
            genericItemSelector: ".js-stream-item"
        })), MediaTweets.attachTo(a, b), SensitiveFlagConfirmationDialog.attachTo(document)
    }
    var activityPopupBoot = require("app/boot/activity_popup"),
        TweetActionsData = require("app/data/tweet_actions"),
        TweetTranslationData = require("app/data/tweet_translation"),
        ConversationsData = require("app/data/conversations"),
        MediaSettingsData = require("app/data/media_settings"),
        SensitiveFlagConfirmationDialog = require("app/ui/dialogs/sensitive_flag_confirmation"),
        ExpandingTweets = require("app/ui/expando/expanding_tweets"),
        MediaTweets = require("app/ui/media/media_tweets"),
        UrlResolver = require("app/data/url_resolver"),
        UserActions = require("app/ui/user_actions"),
        utils = require("core/utils");
    module.exports = initialize
});
define("app/boot/help_pips_enable", ["module", "require", "exports", "app/utils/cookie", "app/utils/storage/core"], function(module, require, exports) {
    function initialize(a) {
        var b = new Storage("help_pips"),
            c = +(new Date);
        b.clear(), b.setItem("until", c + 12096e5), cookie("help_pips", null)
    }
    var cookie = require("app/utils/cookie"),
        Storage = require("app/utils/storage/core");
    module.exports = initialize
});
define("app/data/help_pips", ["module", "require", "exports", "core/component", "app/data/with_data"], function(module, require, exports) {
    function helpPipsData() {
        this.defaultAttrs({
            noShowError: !0
        }), this.loadHelpPips = function(a, b) {
            var c = function(a) {
                this.trigger("dataHelpPipsLoaded", {
                    pips: a
                })
            }.bind(this),
                d = function(a) {
                    this.trigger("dataHelpPipsError")
                }.bind(this);
            this.get({
                url: "/i/help/pips",
                data: {},
                eventData: b,
                success: c,
                error: d
            })
        }, this.after("initialize", function() {
            this.loadHelpPips()
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data");
    module.exports = defineComponent(helpPipsData, withData)
});
define("app/data/help_pips_scribe", ["module", "require", "exports", "core/component", "app/data/with_scribe"], function(module, require, exports) {
    function helpPipsScribe() {
        this.after("initialize", function() {
            this.scribeOnEvent("uiHelpPipIconAdded", "impression"), this.scribeOnEvent("uiHelpPipIconClicked", "open"), this.scribeOnEvent("uiHelpPipPromptFollowed", "success"), this.scribeOnEvent("uiHelpPipExplainTriggered", "show"), this.scribeOnEvent("uiHelpPipExplainClicked", "dismiss"), this.scribeOnEvent("uiHelpPipExplainFollowed", "complete")
        })
    }
    var defineComponent = require("core/component"),
        withScribe = require("app/data/with_scribe");
    module.exports = defineComponent(helpPipsScribe, withScribe)
});
define("app/ui/help_pip", ["module", "require", "exports", "core/component"], function(module, require, exports) {
    function helpPip() {
        this.explainTriggered = function(a) {
            var b = $(a.target).closest(".js-stream-item");
            if (!b.length) return;
            if (this.pip.matcher && b.find(this.pip.matcher).length == 0) return;
            if (this.state == "icon") this.trigger("uiHelpPipExplainTriggered");
            else {
                if (this.state != "prompt") return;
                this.trigger("uiHelpPipPromptFollowed")
            }
            this.showState("explain", b)
        }, this.dismissTriggered = function(a) {
            var b = $(a.target).closest(".js-stream-item");
            if (b.length && this.pip.matcher && b.find(this.pip.matcher).length == 0) return;
            (!b.length || b[0] == this.$streamItem[0]) && this.state == "explain" && this.trigger("uiHelpPipExplainFollowed"), this.dismiss()
        }, this.clicked = function(a) {
            this.state == "icon" ? (this.trigger("uiHelpPipIconClicked"), this.showState("prompt")) : this.state == "explain" && (this.trigger("uiHelpPipExplainClicked"), this.dismiss())
        }, this.showState = function(a, b) {
            if (a == "prompt" && !this.pip.html.prompt) return this.showState("explain", b);
            b = b || this.$streamItem;
            if (this.state == a) return;
            this.state == "icon" && (a == "prompt" || a == "explain") && this.trigger("uiHelpPipOpened", {
                pip: this.pip
            }), this.$streamItem[0] != b[0] && this.unhighlight(), this.state = a, this.$streamItem = b;
            var c = this.$pip.find(".js-pip");
            c.prependTo(this.$pip.parent()).fadeOut("fast", function() {
                c.remove();
                var b = this.pip.html[a],
                    d = this.pip[a + "Highlight"];
                this.$pip.html(b).fadeIn("fast"), d && d != "remove" ? this.highlight(d) : this.unhighlight(d == "remove")
            }.bind(this)), this.$pip.hide().prependTo(b)
        }, this.dismiss = function() {
            this.$streamItem && this.unhighlight(), this.$pip.fadeOut(function() {
                this.remove(), this.teardown(), this.trigger("uiHelpPipDismissed")
            }.bind(this))
        }, this.highlight = function(a) {
            if (this.$streamItem.find(a).is(".stork-highlighted")) return;
            this.unhighlight(), this.$streamItem.find(a).each(function() {
                var a = $(this),
                    b = $("<span>").addClass("stork-highlight-background"),
                    c = $("<span>").addClass("stork-highlight-container").css({
                        width: a.outerWidth(),
                        height: a.outerHeight()
                    });
                a.wrap(c).before(b).addClass("stork-highlighted"), b.fadeIn()
            })
        }, this.unhighlight = function(a) {
            this.$streamItem.find(".stork-highlighted").each(function() {
                var b = $(this),
                    c = b.parent().find(".stork-highlight-background"),
                    d = function() {
                        c.remove(), b.unwrap()
                    };
                b.removeClass("stork-highlighted"), a ? d() : c.fadeOut(d)
            })
        }, this.remove = function() {
            this.$pip.remove()
        }, this.after("initialize", function(a) {
            this.state = "icon", this.pip = a.pip, this.$streamItem = a.$streamItem, this.$pip = $("<div></div>").html(this.pip.html.icon), this.$pip.hide().prependTo(this.$streamItem).fadeIn("fast"), this.on(this.$pip, "click", this.clicked), this.trigger("uiHelpPipIconAdded"), this.on(document, "uiBeforePageChanged", this.remove), this.pip.explainOn && (typeof this.pip.explainOn == "string" && (this.pip.explainOn = {
                event: this.pip.explainOn
            }), this.pip.explainOn.selector ? this.on(this.$node.find(this.pip.explainOn.selector), this.pip.explainOn.event, this.explainTriggered) : this.on(this.pip.explainOn.event, this.explainTriggered)), this.pip.dismissOn && (typeof this.pip.dismissOn == "string" && (this.pip.dismissOn = {
                event: this.pip.dismissOn
            }), this.pip.dismissOn.selector ? this.on(this.$node.find(this.pip.dismissOn.selector), this.pip.dismissOn.event, this.dismissTriggered) : this.on(this.pip.dismissOn.event, this.dismissTriggered))
        })
    }
    var defineComponent = require("core/component");
    module.exports = defineComponent(helpPip)
});
define("app/ui/help_pips_injector", ["module", "require", "exports", "core/component", "app/ui/help_pip", "app/utils/storage/core"], function(module, require, exports) {
    function helpPipsInjector() {
        this.defaultAttrs({
            pipSelector: ".js-pip",
            tweetSelector: ".js-stream-item"
        }), this.pipsLoaded = function(a, b) {
            this.pips = b.pips, this.injectPips()
        }, this.tweetsDisplayed = function(a) {
            this.injectPips()
        }, this.pipOpened = function(a, b) {
            this.storage.setItem(b.pip.category, !0)
        }, this.pipDismissed = function(a) {
            this.injectPips()
        }, this.injectPips = function() {
            if (!this.pips) return;
            if (this.select("pipSelector").length) return;
            var a = this.pips.filter(function(a) {
                return !this.storage.getItem(a.category)
            }.bind(this)),
                b = this.select("tweetSelector").slice(0, 10);
            b.each(function(b, c) {
                var d = $(c),
                    e = !1;
                if (d.attr("data-promoted") || d.find("[data-promoted]").length > 0) return;
                $.each(a, function(a, b) {
                    if (d.find(b.matcher).length) return HelpPip.attachTo(this.$node, {
                        $streamItem: d,
                        pip: b,
                        eventData: {
                            scribeContext: {
                                component: "stork",
                                element: b.id
                            }
                        }
                    }), e = !0, !1
                }.bind(this));
                if (e) return !1
            }.bind(this))
        }, this.after("initialize", function() {
            this.deferredDisplays = [], this.storage = new Storage("help_pips"), this.on(document, "uiTweetsDisplayed", this.tweetsDisplayed), this.on(document, "dataHelpPipsLoaded", this.pipsLoaded), this.on("uiHelpPipDismissed", this.pipDismissed), this.on("uiHelpPipOpened", this.pipOpened)
        })
    }
    var defineComponent = require("core/component"),
        HelpPip = require("app/ui/help_pip"),
        Storage = require("app/utils/storage/core");
    module.exports = defineComponent(helpPipsInjector)
});
define("app/boot/help_pips", ["module", "require", "exports", "app/utils/cookie", "app/utils/storage/core", "app/boot/help_pips_enable", "app/data/help_pips", "app/data/help_pips_scribe", "app/ui/help_pips_injector"], function(module, require, exports) {
    function initialize(a) {
        var b = new Storage("help_pips"),
            c = +(new Date);
        cookie("help_pips") && enableHelpPips(), (b.getItem("until") || 0) > c && (HelpPipsData.attachTo(document), HelpPipsInjector.attachTo("#timeline"), HelpPipsScribe.attachTo(document))
    }
    var cookie = require("app/utils/cookie"),
        Storage = require("app/utils/storage/core"),
        enableHelpPips = require("app/boot/help_pips_enable"),
        HelpPipsData = require("app/data/help_pips"),
        HelpPipsScribe = require("app/data/help_pips_scribe"),
        HelpPipsInjector = require("app/ui/help_pips_injector");
    module.exports = initialize
});
define("app/ui/expando/close_all_button", ["module", "require", "exports", "core/component"], function(module, require, exports) {
    function closeAllButton() {
        this.defaultAttrs({
            timelineFromCacheClass: "js-timeline-from-cache"
        }), this.incrementOpenCount = function() {
            this.toggleButton(++this.openCount)
        }, this.decrementOpenCount = function() {
            this.toggleButton(--this.openCount)
        }, this.toggleButton = function(a) {
            this.$node[a > 0 ? "fadeIn" : "fadeOut"](200)
        }, this.broadcastClose = function(a) {
            a.preventDefault(), this.trigger(this.attr.where, this.attr.closeAllEvent)
        }, this.readOpenCountFromTimeline = function() {
            this.openCount = $(this.attr.where).find(".open").length, this.toggleButton(this.openCount)
        }, this.hide = function() {
            this.$node.hide()
        }, this.after("initialize", function(a) {
            this.openCount = 0, setTimeout(this.readOpenCountFromTimeline.bind(this), 0), this.on(a.where, a.addEvent, this.incrementOpenCount), this.on(a.where, a.subtractEvent, this.decrementOpenCount), this.on("click", this.broadcastClose), this.on(document, "uiShortcutCloseAll", this.broadcastClose), this.on(document, "uiBeforePageChanged", this.hide)
        })
    }
    var defineComponent = require("core/component");
    module.exports = defineComponent(closeAllButton)
});
define("app/ui/timelines/with_keyboard_navigation", ["module", "require", "exports", "core/i18n"], function(module, require, exports) {
    function withKeyboardNavigation() {
        this.defaultAttrs({
            selectedClass: "hovered-stream-item",
            expandedSelectedClass: "js-had-hovered-stream-item",
            firstItemSelector: ".js-stream-item:first",
            ownTweetSelector: ".my-tweet",
            replyLinkSelector: "div.tweet ul.js-actions a.js-action-reply",
            profileCardSelector: ".profile-card",
            streamTweetSelector: ".js-stream-tweet",
            activityMentionClass: "js-activity-mention",
            activityReplyClass: "js-activity-reply"
        }), this.clearSelection = function() {
            this.$selected.removeClass(this.attr.selectedClass + " " + this.attr.expandedSelectedClass), this.$selected = $()
        }, this.selectTopItem = function() {
            this.clearSelection(), this.trigger("uiInjectNewItems"), this.selectAdjacentItem("next")
        }, this.injectAndPossiblySelectTopItem = function() {
            var a = this.$selected.length;
            a && this.clearSelection(), this.trigger("uiInjectNewItems"), a && this.selectAdjacentItem("next")
        }, this.selectPrevItem = function() {
            this.selectAdjacentItem("prev")
        }, this.selectNextItem = function() {
            this.selectAdjacentItem("next")
        }, this.selectNextItemNotFrom = function(a) {
            var b = "next",
                c = this.$selected;
            while (this.getUserId() == a) {
                this.selectAdjacentItem(b);
                if (c == this.$selected) {
                    if (b != "next") return;
                    b = "prev"
                } else c = this.$selected
            }
        }, this.selectAdjacentItem = function(a) {
            var b = this.$selected,
                c = b[a]();
            if (b.length && !c.length) return;
            this.$selected = b.length && c.length ? c : this.select("firstItemSelector"), b.removeClass(this.attr.selectedClass + " " + this.attr.expandedSelectedClass), this.$selected.hasClass("open") ? this.$selected.addClass(this.attr.expandedSelectedClass) : this.$selected.addClass(this.attr.selectedClass), this.$selected.attr("tabIndex", -1).focus(), this.adjustScrollForSelectedItem()
        }, this.favoriteItem = function() {
            this.trigger(this.$selected, "uiDidFavoriteTweetToggle")
        }, this.retweetItem = function() {
            this.itemSelectedIsMine() || this.trigger(this.$selected, "uiDidRetweetTweetToggle")
        }, this.replyItem = function() {
            var a = this.$selected.find(this.attr.replyLinkSelector).first();
            this.trigger(a, "uiDidReplyTweetToggle")
        }, this.blockUser = function() {
            this.takeAction("uiOpenBlockUserDialog")
        }, this.unblockUser = function() {
            this.takeAction("uiUnblockAction")
        }, this.takeAction = function(a) {
            !this.itemSelectedIsMine() && this.itemSelectedIsBlockable() && this.trigger(this.$selected, a, {
                userId: this.getUserId(),
                username: this.getUsername(),
                fromShortcut: !0
            })
        }, this.getUserId = function() {
            return this.$selected.find(this.attr.streamTweetSelector).attr("data-user-id")
        }, this.getUsername = function() {
            return this.$selected.find(this.attr.streamTweetSelector).attr("data-name")
        }, this.itemSelectedIsMine = function() {
            return $(this.$selected).find(this.attr.ownTweetSelector).length > 0
        }, this.itemSelectedIsBlockable = function() {
            return $(this.$selected).children(this.attr.streamTweetSelector).length > 0 || $(this.$selected).hasClass(this.attr.activityReplyClass) || $(this.$selected).hasClass(this.attr.activityMentionClass)
        }, this.updateAfterBlock = function(a, b) {
            $(this.attr.profileCardSelector).size() === 0 && (this.selectNextItemNotFrom(b.userId), this.trigger("uiRemoveTweetsFromUser", b))
        }, this.adjustScrollForItem = function(a) {
            $(window).scrollTop(a.offset().top - $(window).height() / 2)
        }, this.notifyExpansionRequest = function() {
            this.trigger(this.$selected, "uiShouldToggleExpandedState")
        }, this.adjustScrollForSelectedItem = function() {
            this.adjustScrollForItem(this.$selected)
        }, this.handleEvent = function(a) {
            return function() {
                $("body").hasClass("modal-enabled") || this[a].apply(this)
            }
        }, this.after("initialize", function() {
            this.$selected = $(), this.on(document, "uiShortcutSelectPrev", this.handleEvent("selectPrevItem")), this.on(document, "uiShortcutSelectNext", this.handleEvent("selectNextItem")), this.on(document, "uiShortcutEnter", this.handleEvent("notifyExpansionRequest")), this.on(document, "uiShortcutGotoTopOfScreen uiSelectTopTweet", this.handleEvent("selectTopItem")), this.on(document, "uiGotoTopOfScreen", this.handleEvent("injectAndPossiblySelectTopItem")), this.on(document, "uiShortcutFavorite", this.handleEvent("favoriteItem")), this.on(document, "uiShortcutRetweet", this.handleEvent("retweetItem")), this.on(document, "uiShortcutReply", this.handleEvent("replyItem")), this.on(document, "uiShortcutBlock", this.handleEvent("blockUser")), this.on(document, "uiShortcutUnblock", this.handleEvent("unblockUser")), this.on(document, "uiUpdateAfterBlock", this.updateAfterBlock), this.on(document, "uiRemovedSomeTweets", this.adjustScrollForSelectedItem), this.on(document, "uiBeforePageChanged", this.clearSelection)
        })
    }
    var _ = require("core/i18n");
    module.exports = withKeyboardNavigation
});
define("app/ui/with_focus_highlight", ["module", "require", "exports"], function(module, require, exports) {
    function focusHighlight() {
        this.defaultAttrs({
            focusClass: "focus",
            focusContainerSelector: ".tweet"
        }), this.toggleFocus = function(a) {
            $(a.target).closest(this.attr.focusContainerSelector).toggleClass(this.attr.focusClass)
        }, this.after("initialize", function() {
            this.on("focusin focusout", {
                focusContainerSelector: this.toggleFocus
            })
        })
    }
    module.exports = focusHighlight
});
define("app/ui/timelines/with_base_timeline", ["module", "require", "exports", "app/ui/timelines/with_keyboard_navigation", "app/ui/with_interaction_data", "app/utils/scribe_event_initiators", "app/ui/with_focus_highlight", "core/compose", "app/utils/animate_window_scrolltop"], function(module, require, exports) {
    function withBaseTimeline() {
        compose.mixin(this, [withKeyboardNavigation, withInteractionData, withFocusHighLight]), this.defaultAttrs({
            containerSelector: ".stream-container",
            itemsSelector: "#stream-items-id",
            genericItemSelector: ".js-stream-item",
            timelineEndSelector: ".timeline-end",
            backToTopSelector: ".back-to-top",
            lastItemSelector: ".stream-item:last",
            streamItemContentsSelector: ".js-actionable-tweet:first, .js-actionable-user:first, .js-activity:first, .js-story-item:first"
        }), this.injectItems = function(a, b, c, d) {
            var e = $("<div/>").html(b).children();
            e.length > 0 && this.select("timelineEndSelector").addClass("has-items"), this.select("itemsSelector")[a](e);
            var f = [];
            e.each(function(a, b) {
                (c === "uiHasInjectedNewTimeline" || c === "uiHasInjectedOldTimelineItems") && f.push(this.interactionData($(b).find(this.attr.streamItemContentsSelector))), this.trigger(b, "uiHasInjectedTimelineItem")
            }.bind(this));
            var g = {};
            if (c === "uiHasInjectedNewTimeline" || c === "uiHasInjectedOldTimelineItems") g = {
                scribeContext: {
                    component: this.attr.itemType && this.attr.itemType + "_stream"
                },
                scribeData: {},
                items: f
            }, d && d.autoplay && (g.scribeData.event_initiator = eventInitiators.clientSideApp);
            return this.trigger("uiWantsToRefreshTimestamps"), this.trigger(c, g), e
        }, this.inspectItemsFromServer = function(a, b) {
            this.isOldItem(b) ? this.injectOldItems(b) : this.isNewItem(b) && this.notifyNewItems(b)
        }, this.investigateDataError = function(a, b) {
            var c = b.sourceEventData;
            if (!c) return;
            this.wasRangeRequest(c) || this.wasNewItemsRequest(c) || this.wasOldItemsRequest(c) && this.notifyOldItemsError(b)
        }, this.possiblyShowBackToTop = function() {
            var a = this.select("lastItemSelector").position();
            a && a.top >= $(window).height() && this.select("backToTopSelector").show()
        }, this.scrollToTop = function() {
            animateWinScrollTop(0, "fast")
        }, this.getTimelinePosition = function(a) {
            return a.closest(this.attr.genericItemSelector).index()
        }, this.after("initialize", function(a) {
            this.on("dataGotMoreTimelineItems", this.inspectItemsFromServer), this.on("dataGotMoreTimelineItemsError", this.investigateDataError), this.on("click", {
                backToTopSelector: this.scrollToTop
            }), this.possiblyShowBackToTop()
        })
    }
    var withKeyboardNavigation = require("app/ui/timelines/with_keyboard_navigation"),
        withInteractionData = require("app/ui/with_interaction_data"),
        eventInitiators = require("app/utils/scribe_event_initiators"),
        withFocusHighLight = require("app/ui/with_focus_highlight"),
        compose = require("core/compose"),
        animateWinScrollTop = require("app/utils/animate_window_scrolltop");
    module.exports = withBaseTimeline
});
define("app/ui/timelines/with_old_items", ["module", "require", "exports"], function(module, require, exports) {
    function withOldItems() {
        this.defaultAttrs({
            endOfStreamSelector: ".stream-footer",
            errorMessageSelector: ".stream-fail-container",
            tryAgainSelector: ".try-again-after-whale"
        }), this.getOldItems = function() {
            this.shouldGetOldItems() && !this.requestInProgress && (this.requestInProgress = !0, this.trigger("uiWantsMoreTimelineItems", this.getOldItemsData()))
        }, this.injectOldItems = function(a) {
            this.hideWhaleEnd(), this.resetStateVariables(a), this.select("timelineEndSelector")[a.has_more_items ? "addClass" : "removeClass"]("has-more-items");
            var b = this.$document.height();
            this.injectItems(this.attr.isBackward ? "prepend" : "append", a.items_html, "uiHasInjectedOldTimelineItems"), this.attr.isBackward ? (this.$window.scrollTop(this.$document.height() - b), a.has_more_items || this.select("endOfStreamSelector").remove()) : this.possiblyShowBackToTop(), this.requestInProgress = !1
        }, this.notifyOldItemsError = function(a) {
            this.showWhaleEnd(), this.requestInProgress = !1
        }, this.showWhaleEnd = function() {
            this.select("errorMessageSelector").show(), this.select("endOfStreamSelector").hide()
        }, this.hideWhaleEnd = function() {
            this.select("errorMessageSelector").hide(), this.select("endOfStreamSelector").show()
        }, this.tryAgainAfterWhale = function(a) {
            a.preventDefault(), this.hideWhaleEnd(), this.getOldItems()
        }, this.after("initialize", function(a) {
            this.requestInProgress = !1, this.on(window, this.attr.isBackward ? "uiNearTheTop" : "uiNearTheBottom", this.getOldItems), this.$document = $(document), this.$window = $(window), this.on("click", {
                tryAgainSelector: this.tryAgainAfterWhale
            })
        })
    }
    module.exports = withOldItems
});
define("app/utils/chrome", ["module", "require", "exports"], function(module, require, exports) {
    var chrome = {
        globalYOffset: null,
        selectors: {
            globalNav: ".global-nav"
        },
        getGlobalYOffset: function() {
            return chrome.globalYOffset === null && (chrome.globalYOffset = $(chrome.selectors.globalNav).height()), chrome.globalYOffset
        },
        getCanvasYOffset: function(a) {
            return a.offset().top - chrome.getGlobalYOffset()
        }
    };
    module.exports = chrome
});
define("app/ui/timelines/with_traveling_ptw", ["module", "require", "exports"], function(module, require, exports) {
    function withTravelingPTw() {
        this.closePromotedItem = function(a) {
            a.hasClass("open") && this.trigger(a, "uiShouldToggleExpandedState", {
                noAnimation: !0
            })
        }, this.transferClass = function(a, b, c) {
            a.hasClass(b) && (a.removeClass(b), c.addClass(b))
        }, this.keepPTwPinnedToTop = function() {
            var a = this.$promotedItem;
            a.prev().removeClass("before-expanded"), a.css("margin-top", "0px"), this.transferClass(a.next(), "after-expanded", a.prev()), this.select("itemsSelector").prepend(a.detach())
        }, this.repositionPromotedItem = function(a) {
            var b = this.$promotedItem;
            this.transferClass(b, "before-expanded", b.prev()), this.transferClass(b, "after-expanded", b.next()), a.call(this, b.detach()), this.transferClass(b.next(), "after-expanded", "prev")
        }, this.after("initialize", function(a) {
            this.travelingPromoted = a.travelingPromoted, this.$promotedItem = this.$node.find(".promoted-tweet").first().closest(".stream-item")
        }), this.movePromotedToTop = function() {
            if (this.autoplay) return;
            this.repositionPromotedItem(function(a) {
                var b = this.$node.find(this.attr.streamItemsSelector).children().first();
                b[b.hasClass("open") ? "after" : "before"](a)
            })
        }
    }
    module.exports = withTravelingPTw
});
define("app/ui/timelines/with_autoplaying_timeline", ["module", "require", "exports", "core/compose", "app/utils/chrome", "app/ui/timelines/with_traveling_ptw", "app/utils/animate_window_scrolltop"], function(module, require, exports) {
    function withAutoplayingTimeline() {
        compose.mixin(this, [withTravelingPTw]);
        var a = 700,
            b = 750,
            c = 300;
        this.defaultAttrs({
            autoplayControlSelector: ".autoplay-control .play-pause",
            streamItemsSelector: ".stream-items",
            socialProofSelector: ".tweet-stats-container",
            autoplayMarkerSelector: ".stream-autoplay-marker"
        }), this.autoplayNewItems = function(a, b) {
            if (!a) return;
            var c = this.$window.scrollTop(),
                d = c + this.$window.height(),
                e = this.$promotedItem.length && this.$promotedItem.offset().top > d,
                f = this.injectNewItems({}, {
                    autoplay: !0
                });
            this.travelingPTw && e && this.repositionPromotedItem(function(a) {
                f.first().before(a), f = f.add(a), this.trigger(a, "uiShouldFixMargins")
            });
            var g = f.first().offset().top,
                h = g > c && g < d,
                i = this.$container.offset().top,
                j = f.last().next().offset().top - i + 1;
            if (h) this.$container.css("marginTop", -j), this.animateBlockOfItems(f);
            else {
                var k = chrome.getGlobalYOffset(),
                    l = this.$notification.is(":visible") ? k : -100;
                this.showingAutoplayMarker = !1, this.setScrollerScrollTop(c + j), this.$notification.show().find(".text").text($(a).text()).end().css({
                    top: l,
                    left: this.$container.offset().left,
                    opacity: .9
                }).animate({
                    top: k
                }, {
                    duration: 500,
                    complete: function() {
                        var a = this.newItemsXLine;
                        this.newItemsXLine = a > 0 ? a + j : i + j, this.showingAutoplayMarker = !0, this.latentItems.count = b
                    }.bind(this)
                })
            }
        }, this.animateBlockOfItems = function(b) {
            var c = this.$window.scrollTop(),
                d = parseFloat(this.$container.css("marginTop")),
                e = -b.first().position().top;
            this.isAnimating = !0, this.$container.parent().css("overflow", "hidden"), this.$container.animate({
                marginTop: 0
            }, {
                duration: a + Math.abs(d),
                step: function(a) {
                    this.lockedTimelineScroll && this.setScrollerScrollTop(c + Math.abs(d - Math.ceil(a)))
                }.bind(this),
                complete: function() {
                    this.$container.parent().css("overflow", "inherit"), this.isAnimating = !1, this.afterAnimationQueue.forEach(function(a) {
                        a.call(this)
                    }, this), this.afterAnimationQueue = []
                }.bind(this)
            })
        }, this.handleSocialProofPops = function(a) {
            var b = $(a.target).closest(".stream-item");
            if (this.lastClickedItem && b[0] === this.lastClickedItem) return;
            var c = $(a.target).find(this.attr.socialProofSelector).hide(),
                d = function() {
                    var a = b.next().offset().top;
                    c.show();
                    var d = b.next().offset().top,
                        e = this.$window.scrollTop();
                    (this.lockedTimelineScroll || e > d) && this.setScrollerScrollTop(e + (d - a))
                }.bind(this);
            this.isAnimating ? this.afterAnimationQueue.push(d) : d()
        }, this.animateScrollToTop = function() {
            var a = this.$container.offset().top - 150,
                d = {
                    duration: b
                };
            this.attr.overflowScroll ? this.$node.animate({
                scrollTop: a
            }, d) : animateWinScrollTop(a, d), this.$notification.animate({
                top: -200,
                opacity: 0
            }, {
                duration: c
            })
        }, this.setScrollerScrollTop = function(a) {
            var b = this.attr.overflowScroll ? this.$node : $(window);
            b.scrollTop(a)
        }, this.removeAutoplayMarkerOnScroll = function() {
            var a, b = function() {
                this.showingAutoplayMarker ? (this.showingAutoplayMarker = !1, this.$notification.fadeOut(200)) : this.newItemsXLine > 0 && this.$window.scrollTop() < this.newItemsXLine && (this.newItemsXLine = 0, this.latentItems.count = 0)
            }.bind(this);
            this.$window.scroll(function(c) {
                if (!this.autoplay) return;
                clearTimeout(a), a = setTimeout(b, 0)
            }.bind(this))
        }, this.toggleAutoplay = function(a) {
            $(".tooltip").remove(), $(a.target).parent().toggleClass("paused").hasClass("paused") ? this.disableAutoplay() : this.reenableAutoplay()
        }, this.disableAutoplay = function() {
            this.autoplay = !1, this.trigger("uiHasDisabledAutoplay")
        }, this.reenableAutoplay = function() {
            this.autoplay = !0, this.lockedTimelineScroll = !1, this.trigger("uiHasEnabledAutoplay");
            var a = this.select("newItemsBarSelector");
            a.animate({
                marginTop: -a.outerHeight(),
                opacity: 0
            }, {
                duration: 225,
                complete: this.autoplayNewItems.bind(this, a.html())
            })
        }, this.enableAutoplay = function(a) {
            this.autoplay = !0, this.travelingPTw = a.travelingPTw, this.lockedTimelineScroll = !1, this.afterAnimationQueue = [], this.newItemsXLine = 0, this.$container = this.select("streamItemsSelector"), this.$notification = this.select("autoplayMarkerSelector"), this.$window = a.overflowScroll ? this.$node : $(window), this.on("mouseover", function() {
                this.lockedTimelineScroll = !0
            }), this.on("mouseleave", function() {
                this.lockedTimelineScroll = !1
            }), this.on("uiHasRenderedTweetSocialProof", this.handleSocialProofPops), this.on("uiHasExpandedTweet", function(a) {
                this.lastClickedItem = $(a.target).data("expando").$container.get(0)
            }), this.on("click", {
                autoplayControlSelector: this.toggleAutoplay,
                autoplayMarkerSelector: this.animateScrollToTop
            }), this.removeAutoplayMarkerOnScroll(), this.$notification.width(this.$notification.width()).css("position", "fixed")
        }, this.after("initialize", function(a) {
            a.autoplay && this.enableAutoplay(a)
        })
    }
    var compose = require("core/compose"),
        chrome = require("app/utils/chrome"),
        withTravelingPTw = require("app/ui/timelines/with_traveling_ptw"),
        animateWinScrollTop = require("app/utils/animate_window_scrolltop");
    module.exports = withAutoplayingTimeline
});
define("app/ui/timelines/with_polling", ["module", "require", "exports", "core/utils", "app/utils/setup_polling_with_backoff"], function(module, require, exports) {
    function withPolling() {
        this.defaultAttrs({
            pollingWatchNode: $(window),
            pollingEnabled: !0
        }), this.pausePolling = function() {
            this.pollingTimer.pause(), this.pollingPaused = !0
        }, this.resetPolling = function() {
            this.backoffEmptyResponseCount = 0, this.pollingPaused = !1
        }, this.pollForNewItems = function(a, b) {
            this.trigger("uiTimelineShouldRefresh", {
                injectImmediately: !1,
                interval: this.pollingTimer.interval,
                fromPolling: !0
            })
        }, this.onGotMoreTimelineItems = function(a, b) {
            if (!(this.attr.pollingOptions && this.attr.pollingOptions.pauseAfterBackoff && b && b.sourceEventData)) return;
            var c = b.sourceEventData;
            c.fromPolling && (this.isNewItem(b) || c.interval < this.attr.pollingOptions.blurredInterval ? this.resetPolling() : ++this.backoffEmptyResponseCount >= this.attr.pollingOptions.backoffEmptyResponseLimit && this.pausePolling())
        }, this.modifyNewItemsData = function(a) {
            var b = a();
            return this.pollingPaused && this.attr.pollingOptions ? (this.resetPolling(), utils.merge(b, {
                count: this.attr.pollingOptions.resumeItemCount
            })) : b
        }, this.possiblyRefreshBeforeInject = function(a, b, c) {
            return this.pollingPaused && b && b.type === "click" && this.trigger("uiTimelineShouldRefresh", {
                injectImmediately: !0
            }), a(b, c)
        }, this.around("getNewItemsData", this.modifyNewItemsData), this.around("injectNewItems", this.possiblyRefreshBeforeInject), this.after("initialize", function() {
            if (!this.attr.pollingEnabled) return;
            this.on(document, "uiTimelinePollForNewItems", this.pollForNewItems), this.on(document, "dataGotMoreTimelineItems", this.onGotMoreTimelineItems), this.pollingTimer = setupPollingWithBackoff("uiTimelinePollForNewItems", this.attr.pollingWatchNode, this.attr.pollingOptions), this.resetPolling()
        })
    }
    var utils = require("core/utils"),
        setupPollingWithBackoff = require("app/utils/setup_polling_with_backoff");
    module.exports = withPolling
});
define("app/ui/timelines/with_new_items", ["module", "require", "exports", "core/utils", "core/compose", "app/utils/chrome", "app/ui/timelines/with_autoplaying_timeline", "app/ui/timelines/with_polling"], function(module, require, exports) {
    function withNewItems() {
        this.injectNewItems = function(a, b) {
            if (!this.latentItems.html) return;
            this.select("newItemsBarSelector").remove();
            var c = this.injectItems("prepend", this.latentItems.html, "uiHasInjectedNewTimeline", b);
            return this.resetLatentItems(), c
        }, compose.mixin(this, [withAutoplayingTimeline, withPolling]), this.defaultAttrs({
            newItemsBarSelector: ".js-new-tweets-bar",
            streamItemSelector: ".stream-item",
            refreshOnReturn: !0
        }), this.getNewItems = function(a, b) {
            this.trigger("uiWantsMoreTimelineItems", utils.merge({
                include_new_items_bar: !b || !b.injectImmediately,
                latent_count: this.latentItems.count,
                composed_count: Object.keys(this.composedThenInjectedTweetIds).length
            }, this.getNewItemsData(), b))
        }, this.notifyNewItems = function(a) {
            if (!a.items_html) return;
            var b = a.sourceEventData || {};
            this.resetStateVariables(a);
            var c = this.attr.injectComposedTweets && this.removeComposedTweetsFromPayload(a);
            if (!a.items_html) return;
            this.latentItems.html = a.items_html + (this.latentItems.html || "");
            if (a.new_tweets_bar_html) {
                var d, e = a.new_tweets_bar_alternate_html;
                this.attr.injectComposedTweets && c > 0 && e && e[c - 1] ? d = $(e[c - 1]) : d = $(a.new_tweets_bar_html), this.latentItems.count = d.children().first().data("item-count"), this.autoplay ? this.autoplayNewItems(a.new_tweets_bar_html, this.latentItems.count) : b.injectImmediately || this.updateNewItemsBar(d), this.trigger("uiAddPageCount", {
                    count: this.latentItems.count
                })
            }
            b.injectImmediately && this.trigger("uiInjectNewItems"), b.scrollToTop && this.scrollToTop(), b.selectTopTweet && this.trigger("uiSelectTopTweet")
        }, this.removeComposedTweetsFromPayload = function(a) {
            var b = this.composedThenInjectedTweetIds,
                c = $(a.items_html).filter(this.attr.streamItemSelector);
            if (c.length == 0) return 0;
            var d = 0,
                e = c.filter(function(a, c) {
                    var e = $(c).attr("data-item-id");
                    return e in b ? (d++, delete b[e], !1) : !0
                });
            return a.items_html = $("<div/>").append(e).html(), d
        }, this.updateNewItemsBar = function(a) {
            var b = this.select("newItemsBarSelector"),
                c = this.select("containerSelector"),
                d = $(window).scrollTop(),
                e = chrome.getCanvasYOffset(c);
            b.length ? (b.parent().remove(), a.prependTo(c)) : (a.hide().prependTo(c), d > e ? (a.show(), $("html, body").scrollTop(d + a.height())) : a.slideDown())
        }, this.resetLatentItems = function() {
            this.latentItems = {
                count: 0,
                html: ""
            }
        }, this.refreshAndScrollToTopOnNavigate = function(a, b) {
            b.fromCache && this.attr.refreshOnReturn && this.trigger("uiTimelineShouldRefresh", {
                injectImmediately: !0,
                scrollToTop: !0,
                navigated: !0
            })
        }, this.refreshAndSelectTopTweet = function(a, b) {
            this.trigger("uiTimelineShouldRefresh", {
                injectImmediately: !0,
                selectTopTweet: !0
            })
        }, this.injectComposedTweet = function(a, b) {
            if (b.in_reply_to_status_id) return;
            this.injectNewItems();
            var c = $(b.tweet_html).filter(this.attr.streamItemSelector).first().attr("data-item-id");
            if (this.$node.find(".original-tweet[data-tweet-id='" + c + "']:first").length) return;
            this.latentItems.html = b.tweet_html, this.injectNewItems(), this.composedThenInjectedTweetIds[b.tweet_id] = !0
        }, this.refreshAndInjectImmediately = function(a, b) {
            this.trigger("uiTimelineShouldRefresh", {
                injectImmediately: !0,
                selectTopTweet: this.$selected.length == 1
            })
        }, this.resetCacheOfComposedInjectedTweets = function(a, b) {
            this.composedThenInjectedTweetIds = composedThenInjectedTweetIds = {}
        }, this.after("initialize", function(a) {
            this.composedThenInjectedTweetIds = composedThenInjectedTweetIds, this.resetLatentItems(), this.on("uiInjectNewItems", this.injectNewItems), this.on("uiTimelineShouldRefresh", this.getNewItems), this.on(document, "uiBeforePageChanged", this.injectNewItems), this.on(document, "uiPageChanged", this.refreshAndScrollToTopOnNavigate), this.on(document, "uiGotoTopOfScreen", this.refreshAndInjectImmediately), this.on(document, "uiShortcutGotoTopOfScreen", this.refreshAndSelectTopTweet), this.on(document, "dataPageMutated", this.resetCacheOfComposedInjectedTweets), this.attr.injectComposedTweets && this.on(document, "dataTweetSuccess", this.injectComposedTweet), this.on("click", {
                newItemsBarSelector: this.injectNewItems
            })
        })
    }
    var utils = require("core/utils"),
        compose = require("core/compose"),
        chrome = require("app/utils/chrome"),
        withAutoplayingTimeline = require("app/ui/timelines/with_autoplaying_timeline"),
        withPolling = require("app/ui/timelines/with_polling"),
        composedThenInjectedTweetIds = {};
    module.exports = withNewItems
});
define("app/ui/timelines/with_tweet_pagination", ["module", "require", "exports", "app/utils/string"], function(module, require, exports) {
    function withTweetPagination() {
        this.isOldItem = function(a) {
            return a.max_id && (!this.max_id || string.compare(this.max_id, a.max_id) >= 0)
        }, this.isNewItem = function(a) {
            return a.since_id && string.compare(this.since_id, a.since_id) < 0
        }, this.wasRangeRequest = function(a) {
            return a.max_id && a.since_id
        }, this.wasNewItemsRequest = function(a) {
            return a.since_id
        }, this.wasOldItemsRequest = function(a) {
            return a.max_id
        }, this.shouldGetOldItems = function() {
            var a = typeof this.max_id != "undefined" && this.max_id !== null;
            return !a || this.max_id != "-1"
        }, this.getOldItemsData = function() {
            return {
                max_id: this.max_id,
                query: this.query
            }
        }, this.getNewItemsData = function() {
            return {
                since_id: this.since_id,
                query: this.query
            }
        }, this.resetStateVariables = function(a) {
            ["max_id", "since_id", "query"].forEach(function(b, c) {
                typeof a[b] != "undefined" && (this[b] = a[b], (b == "max_id" || b == "since_id") && this.select("containerSelector").attr("data-" + b.replace("_", "-"), this[b]))
            }, this)
        }, this.after("initialize", function(a) {
            this.since_id = this.select("containerSelector").attr("data-since-id") || "", this.max_id = this.select("containerSelector").attr("data-max-id") || "", this.query = a.query || ""
        })
    }
    var string = require("app/utils/string");
    module.exports = withTweetPagination
});
define("app/ui/timelines/with_activity_supplements", ["module", "require", "exports"], function(module, require, exports) {
    function withActivitySupplements() {
        this.defaultAttrs({
            networkActivityPageViewAllToggle: ".stream-item-activity-network",
            viewAllSupplementsButton: "button.view-all-supplements",
            interactionsPageViewAllToggle: ".stream-item-activity-me button.view-all-supplements",
            additionalStreamItemsSelector: ".sub-stream-item-showing,.sub-stream-item-hidden",
            additionalNetworkActivityItems: ".hidden-supplement, .hidden-supplement-expanded",
            hiddenSupplement: "hidden-supplement",
            visibleSupplement: "hidden-supplement-expanded",
            hiddenSubItem: "sub-stream-item-hidden",
            visibleSubItem: "sub-stream-item-showing"
        }), this.toggleSupplementTrigger = function(a) {
            var b = a.hasClass("show");
            return a.toggleClass("hide", b).toggleClass("show", !b), b
        }, this.toggleInteractionsSupplements = function(a, b) {
            var c = $(b.el),
                d = this.toggleSupplementTrigger(c);
            this.openSubStreamItems(c.parent(), d)
        }, this.toggleNetworkActivitySupplements = function(a, b) {
            if ($(a.target).closest(".supplement").length > 0) return;
            var c = $(b.el),
                d = this.toggleSupplementTrigger(c.find(this.attr.viewAllSupplementsButton));
            this.openSubStreamItems(c, d), c.find(this.attr.additionalNetworkActivityItems).toggleClass("hidden-supplement", !d).toggleClass("hidden-supplement-expanded", d)
        }, this.openSubStreamItems = function(a, b) {
            a.find(this.attr.additionalStreamItemsSelector).toggleClass("sub-stream-item-hidden", !b).toggleClass("sub-stream-item-showing", b)
        }, this.after("initialize", function(a) {
            this.on("click", {
                interactionsPageViewAllToggle: this.toggleInteractionsSupplements,
                networkActivityPageViewAllToggle: this.toggleNetworkActivitySupplements
            })
        })
    }
    module.exports = withActivitySupplements
});
define("app/ui/timelines/tweet_timeline", ["module", "require", "exports", "core/component", "app/ui/timelines/with_base_timeline", "app/ui/timelines/with_old_items", "app/ui/timelines/with_new_items", "app/ui/timelines/with_tweet_pagination", "app/ui/timelines/with_activity_supplements", "app/ui/with_timestamp_updating", "app/ui/with_tweet_actions", "app/ui/with_item_actions", "app/ui/timelines/with_traveling_ptw", "app/ui/gallery/with_gallery"], function(module, require, exports) {
    function tweetTimeline() {
        this.defaultAttrs({
            itemType: "tweet"
        }), this.reportInitialTweetsDisplayed = function() {
            var a = this.select("genericItemSelector"),
                b = [];
            a.each(function(a, c) {
                var d = this.interactionData($(c).find(this.attr.streamItemContentsSelector));
                this.attr.reinjectedPromotedTweets && (d.impressionId = undefined), b.push(d)
            }.bind(this));
            var c = {
                scribeContext: {
                    component: "stream"
                },
                tweets: b
            };
            this.trigger("uiTweetsDisplayed", c)
        }, this.reportTweetsDisplayed = function(a, b) {
            b.tweets = b.items, this.trigger("uiTweetsDisplayed", b)
        }, this.removeTweetsFromUser = function(a, b) {
            var c = this.$node.find("[data-user-id=" + b.userId + "]");
            c.parent().remove(), this.trigger("uiRemovedSomeTweets")
        }, this.after("initialize", function(a) {
            this.attr.reinjectedPromotedTweets = a.reinjectedPromotedTweets, this.reportInitialTweetsDisplayed(), this.on("uiHasInjectedNewTimeline uiHasInjectedOldTimelineItems", this.reportTweetsDisplayed), this.on("uiRemoveTweetsFromUser", this.removeTweetsFromUser), a.pinPromotedTweets && this.on("uiHasInjectedNewTimeline", this.keepPTwPinnedToTop)
        })
    }
    var defineComponent = require("core/component"),
        withBaseTimeline = require("app/ui/timelines/with_base_timeline"),
        withOldItems = require("app/ui/timelines/with_old_items"),
        withNewItems = require("app/ui/timelines/with_new_items"),
        withTweetPagination = require("app/ui/timelines/with_tweet_pagination"),
        withActivitySupplements = require("app/ui/timelines/with_activity_supplements"),
        withTimestampUpdating = require("app/ui/with_timestamp_updating"),
        withTweetActions = require("app/ui/with_tweet_actions"),
        withItemActions = require("app/ui/with_item_actions"),
        withTravelingPtw = require("app/ui/timelines/with_traveling_ptw"),
        withGallery = require("app/ui/gallery/with_gallery");
    module.exports = defineComponent(tweetTimeline, withBaseTimeline, withTweetPagination, withOldItems, withNewItems, withTimestampUpdating, withTweetActions, withItemActions, withTravelingPtw, withActivitySupplements, withGallery)
});
define("app/boot/tweet_timeline", ["module", "require", "exports", "app/boot/timeline", "app/boot/tweets", "app/boot/help_pips", "app/ui/expando/close_all_button", "app/ui/timelines/tweet_timeline", "core/utils"], function(module, require, exports) {
    function initialize(a, b, c, d) {
        var e = utils.merge(a, {
            endpoint: b,
            itemType: c,
            eventData: {
                scribeContext: {
                    component: d || c
                }
            }
        });
        timelineBoot(e), tweetsBoot("#timeline", e), e.help_pips_decider && helpPipsBoot(e), CloseAllButton.attachTo("#close-all-button", {
            addEvent: "uiHasExpandedTweet",
            subtractEvent: "uiHasCollapsedTweet",
            where: "#timeline",
            closeAllEvent: "uiWantsToCloseAllTweets"
        }), TweetTimeline.attachTo("#timeline", utils.merge(e, {
            tweetItemSelector: "div.original-tweet",
            pinPromotedTweets: e.pinPromotedTweets
        }))
    }
    var timelineBoot = require("app/boot/timeline"),
        tweetsBoot = require("app/boot/tweets"),
        helpPipsBoot = require("app/boot/help_pips"),
        CloseAllButton = require("app/ui/expando/close_all_button"),
        TweetTimeline = require("app/ui/timelines/tweet_timeline"),
        utils = require("core/utils");
    module.exports = initialize
});
define("app/ui/who_to_follow/with_user_recommendations", ["module", "require", "exports", "app/ui/with_user_actions", "app/ui/with_item_actions", "app/data/ddg", "core/i18n", "core/utils", "$lib/bootstrap_tooltip.js"], function(module, require, exports) {
    function withUserRecommendations() {
        this.defaultAttrs({
            refreshAnimationDuration: 200,
            cycleTimeout: 1e3,
            experimentCycleTimeout: 300,
            wtfOptions: {},
            selfPromotedAccountHtml: "",
            $accountPriorToPreview: null,
            recListSelector: ".js-recommended-followers",
            recSelector: ".js-actionable-user",
            refreshRecsSelector: ".js-refresh-suggestions",
            similarToContainerSelector: ".js-expanded-similar-to",
            expandedContainerSelector: ".js-expanded-container",
            itemType: "user"
        }), this.refreshRecommendations = function(a, b) {
            if (!this.currentlyRefreshing) {
                this.currentlyRefreshing = !0;
                var c = this.getVisibleIds(),
                    d = c.length || this.attr.wtfOptions.limit;
                this.trigger("uiRefreshUserRecommendations", utils.merge(this.attr.wtfOptions, {
                    excluded: c,
                    limit: d
                })), this.hideRecommendations()
            }
        }, this.getUserRecommendations = function(a, b) {
            this.trigger("uiGetUserRecommendations", utils.merge(this.attr.wtfOptions, a || {})), this.hideRecommendations()
        }, this.hideRecommendations = function() {
            this.animateContentOut(this.select("recListSelector"), "animationCallback")
        }, this.handleRecommendationsResponse = function(a, b) {
            if (this.disabled) return;
            b = b || {};
            var c = b.user_recommendations_html;
            if (c) {
                var d = this.currentlyRefreshingUser(b);
                this.$node.addClass("has-content");
                if (this.shouldExpandWtf(b)) {
                    var e = $(c),
                        f = e.filter(this.attr.recSelector).first(),
                        g = e.filter(this.attr.expandedContainerSelector);
                    d && this.animateContentIn(d, "animationCallback", $("<div>").append(f).html(), {
                        modOp: "replaceWith",
                        scribeCallback: function() {
                            this.currentlyExpanding ? this.pendingScribe = !0 : this.reportUsersDisplayed(b)
                        }.bind(this)
                    }), g.size() && this.animateExpansion(g, b)
                } else {
                    var h = this.select("recListSelector"),
                        i;
                    d && (h = d, i = "replaceWith"), this.animateContentIn(h, "animationCallback", c, {
                        modOp: i,
                        scribeCallback: function() {
                            this.reportUsersDisplayed(b)
                        }.bind(this)
                    })
                }
            } else this.handleEmptyRefreshResponse(a, b), this.trigger("uiGotEmptyRecommendationsResponse", b)
        }, this.handleRefreshError = function(a, b) {
            this.handleEmptyRefreshResponse(a, b)
        }, this.handleEmptyRefreshResponse = function(a, b) {
            if (!this.select("recSelector").length) return;
            var c = this.select("recListSelector"),
                d = this.currentlyRefreshingUser(b);
            d && (c = d), this.animateContentIn(c, "animationCallback", c.html())
        }, this.getVisibleIds = function(a) {
            return this.select("recSelector").not(a).map(function() {
                return $(this).attr("data-user-id")
            }).toArray()
        }, this.originalItemCount = function() {
            return $(this.attr.recListSelector).children(this.attr.recSelector).length
        }, this.doAfterFollowAction = function(a, b) {
            if (this.disabled || b.newState != "following") return;
            var c = this.expandBucket ? this.attr.experimentCycleTimeout : this.attr.cycleTimeout;
            setTimeout(function() {
                if (this.currentlyRefreshing) return;
                var a = this.select("recSelector").filter("[data-user-id='" + b.userId + "']");
                if (!a.length) return;
                this.cycleRecommendation(a, b)
            }.bind(this), c)
        }, this.isInSimilarToSection = function(a) {
            return !!a.closest(this.attr.similarToContainerSelector).length
        }, this.cycleRecommendation = function(a, b) {
            this.animateContentOut(a, "animationCallback");
            var c = utils.merge(this.attr.wtfOptions, {
                limit: 1,
                visible: this.getVisibleIds(a),
                refreshUserId: b.userId
            });
            this.isInSimilarToSection(a) && (c.user_id = this.select("similarToContainerSelector").data("similar-to-user-id")), this.trigger("uiGetUserRecommendations", c)
        }, this.animateExpansion = function(a, b) {
            var c = this.select("recListSelector"),
                d = this.select("expandedContainerSelector"),
                e = function() {
                    this.pendingScribe && (this.reportUsersDisplayed(b), this.pendingScribe = !1), this.currentlyExpanding = !1
                };
            d.length ? d.html(a.html()) : c.append(a), a.is(":visible") ? e.bind(this)() : a.slideDown("slow", e.bind(this))
        }, this.animateContentIn = function(a, b, c, d) {
            if (!a.length) return;
            d = d || {};
            var e = function() {
                a.is(this.attr.recListSelector) && (this.currentlyRefreshing = !1), a[d.modOp || "html"](c).animate({
                    opacity: 1
                }, this.attr.refreshAnimationDuration), d.scribeCallback && d.scribeCallback()
            }.bind(this);
            a.is(":animated") ? this[b] = e : e()
        }, this.animateContentOut = function(a, b) {
            a.animate({
                opacity: 0
            }, {
                duration: this.attr.refreshAnimationDuration,
                complete: function() {
                    this[b] && this[b](), this[b] = null
                }.bind(this)
            })
        }, this.getItemPosition = function(a) {
            var b = this.originalItemCount();
            return this.isInSimilarToSection(a) ? b + a.closest(this.attr.recSelector).index() - 1 : a.closest(this.attr.expandedContainerSelector).length ? b + a.closest(this.attr.recSelector).index() : a.closest(this.attr.recSelector).index()
        }, this.currentlyRefreshingUser = function(a) {
            return !a || !a.sourceEventData || !a.sourceEventData.refreshUserId ? null : this.select("recSelector").filter("[data-user-id=" + a.sourceEventData.refreshUserId + "]")
        }, this.shouldExpandWtf = function(a) {
            return !!(a && a.sourceEventData && a.sourceEventData.get_replacement)
        }, this.getUsersDisplayed = function() {
            var a = this.select("recSelector"),
                b = [];
            return a.each(function(a, c) {
                var d = $(c);
                b.push({
                    id: d.attr("data-user-id"),
                    impressionId: d.attr("data-impression-id")
                })
            }), b
        }, this.reportUsersDisplayed = function(a) {
            var b = this.getUsersDisplayed();
            this.trigger("uiUsersDisplayed", {
                users: b
            }), this.trigger("uiDidGetRecommendations", a)
        }, this.verifyInitialRecommendations = function() {
            this.hasRecommendations() ? this.reportUsersDisplayed({
                initialResults: !0
            }) : this.getUserRecommendations({
                initialResults: !0
            })
        }, this.hasRecommendations = function() {
            return this.select("recSelector").length > 0
        }, this.storeSelfPromotedAccount = function(a, b) {
            b.html && (this.selfPromotedAccountHtml = b.html)
        }, this.replaceUser = function(a, b) {
            a.tooltip("hide"), a.parent().hasClass("preview-wrapper") && a.unwrap(), a.replaceWith(b)
        }, this.replaceUserAnimation = function(a, b) {
            a.tooltip("hide"), this.before("teardown", function() {
                this.replaceUser(a, b)
            });
            var c = $("<div/>", {
                "class": a.attr("class"),
                style: a.attr("style")
            }).addClass("preview-wrapper");
            a.wrap(c);
            var d = a.css("minHeight");
            a.css({
                minHeight: 0
            }).slideUp(70, function() {
                b.attr("style", a.attr("style")), a.replaceWith(b), b.delay(350).slideDown(70, function() {
                    b.css({
                        minHeight: d
                    }), b.unwrap(), setTimeout(function() {
                        b.tooltip("show"), setTimeout(function() {
                            b.tooltip("hide")
                        }, 8e3)
                    }, 500)
                })
            })
        }, this.handlePreviewPromotedAccount = function() {
            if (this.disabled) return;
            if (this.selfPromotedAccountHtml) {
                var a = $(this.selfPromotedAccountHtml),
                    b = this.select("recSelector").first();
                this.attr.$accountPriorToPreview = b.clone(), this.replaceUserAnimation(b, a), a.find("a").on("click", function(a) {
                    a.preventDefault(), a.stopPropagation()
                })
            }
        }, this.maybeRestoreAccountPriorToPreview = function() {
            var a = this.attr.$accountPriorToPreview;
            if (!a) return;
            this.replaceUser(this.select("recSelector").first(), a), this.attr.$accountPriorToPreview = null
        }, this.after("initialize", function() {
            this.on(document, "dataDidGetUserRecommendations", this.handleRecommendationsResponse), this.on(document, "dataFailedToGetUserRecommendations", this.handleRefreshError), this.on(document, "dataFollowStateChange", this.doAfterFollowAction), this.on("click", {
                refreshRecsSelector: this.refreshRecommendations
            }), this.on(document, "dataDidGetSelfPromotedAccount", this.storeSelfPromotedAccount), this.on(document, "uiPromptbirdPreviewPromotedAccount", this.handlePreviewPromotedAccount), this.on(document, "uiPromptbirdDismissPrompt", this.maybeRestoreAccountPriorToPreview)
        })
    }
    var withUserActions = require("app/ui/with_user_actions"),
        withItemActions = require("app/ui/with_item_actions"),
        ddg = require("app/data/ddg"),
        _ = require("core/i18n"),
        utils = require("core/utils");
    require("$lib/bootstrap_tooltip.js"), module.exports = withUserRecommendations
});
define("app/ui/who_to_follow/who_to_follow_dashboard", ["module", "require", "exports", "core/i18n", "core/utils", "core/compose", "app/data/ddg", "core/component", "app/ui/with_user_actions", "app/ui/with_item_actions", "app/ui/who_to_follow/with_user_recommendations"], function(module, require, exports) {
    function whoToFollowDashboard() {
        this.defaultAttrs({
            dashboardSelector: ".dashboard-user-recommendations",
            recUserSelector: ".dashboard-user-recommendations .js-actionable-user",
            dismissRecSelector: ".dashboard-user-recommendations .js-actionable-user .js-action-dismiss",
            viewAllSelector: ".js-view-all-link",
            interestsSelector: ".js-interests-link",
            findFriendsSelector: ".js-find-friends-link"
        }), this.dismissRecommendation = function(a, b) {
            if (!this.currentlyRefreshing) {
                this.currentlyDismissing = !0;
                var c = $(a.target).closest(this.attr.recSelector),
                    d = c.attr("data-user-id");
                this.trigger("uiDismissUserRecommendation", {
                    recommended_user_id: d,
                    impressionId: c.attr("data-impression-id"),
                    excluded: [d],
                    visible: this.getVisibleIds(c),
                    token: c.attr("data-feedback-token"),
                    dismissable: this.attr.wtfOptions.dismissable,
                    refreshUserId: d
                }), this.animateContentOut(c, "animationCallback")
            }
        }, this.handleDismissResponse = function(a, b) {
            b = b || {}, this.currentlyDismissing = !1;
            if (b.user_recommendations_html) {
                var c = this.currentlyRefreshingUser(b),
                    d = $(b.user_recommendations_html),
                    e = this.getItemPosition(c);
                this.animateContentIn(c, "animationCallback", b.user_recommendations_html, {
                    modOp: "replaceWith",
                    scribeCallback: function() {
                        var a = {
                            oldUser: this.interactionData(c, {
                                position: e
                            })
                        };
                        d.length && (a.newUser = this.interactionData(d, {
                            position: e
                        })), this.trigger("uiDidDismissUserRecommendation", a)
                    }.bind(this)
                })
            } else this.handleEmptyDismissResponse()
        }, this.handleDismissError = function(a, b) {
            var c = this.currentlyRefreshingUser(b);
            c && c.remove(), this.handleEmptyDismissResponse()
        }, this.handleEmptyDismissResponse = function() {
            this.select("recSelector").length || (this.trigger("uiShowMessage", {
                message: _('You have no more recommendations today!')
            }), this.$node.remove())
        }, this.enable = function() {
            this.disabled = !1, this.refreshRecommendations(), this.$node.show()
        }, this.initRecommendations = function() {
            this.disabled ? this.$node.hide() : this.verifyInitialRecommendations()
        }, this.reset = function() {
            this.currentlyRefreshing || this.currentlyDismissing ? this.select("dashboardSelector").html("") : (this.select("dashboardSelector").css("opacity", 1), this.select("recUserSelector").css("opacity", 1))
        }, this.expandWhoToFollow = function(a, b) {
            this.currentlyExpanding = !0;
            var c = utils.merge(this.attr.wtfOptions, {
                limit: 3,
                visible: this.getVisibleIds(a),
                refreshUserId: b.userId,
                get_replacement: !0
            });
            this.trigger("uiGetUserRecommendations", c)
        }, this.triggerLinkClickScribes = function(a) {
            var b = this,
                c = {
                    interests_link: this.attr.interestsSelector,
                    import_link: this.attr.findFriendsSelector,
                    view_all_link: this.attr.viewAllSelector,
                    refresh_link: this.attr.refreshRecsSelector
                }, d = $(a.target);
            $.each(c, function(a, c) {
                d.is(c) && b.trigger(document, "uiClickedWtfLink", {
                    element: a
                })
            })
        }, this.after("initialize", function() {
            this.disabled = this.attr.wtfOptions ? this.attr.wtfOptions.disabled : !1, this.on(document, "dataDidDismissRecommendation", this.handleDismissResponse), this.on(document, "dataFailedToDismissUserRecommendation", this.handleDismissError), this.on(document, "uiDidHideEmptyTimelineModule", this.enable), this.on(document, "uiSwiftLoaded uiPageChanged", this.initRecommendations), this.on(document, "uiBeforePageChanged", this.reset), this.on("click", {
                dismissRecSelector: this.dismissRecommendation,
                interestsSelector: this.triggerLinkClickScribes,
                viewAllSelector: this.triggerLinkClickScribes,
                findFriendsSelector: this.triggerLinkClickScribes,
                refreshRecsSelector: this.triggerLinkClickScribes
            }), this.around("cycleRecommendation", function(a, b, c) {
                this.attr.wtfOptions.display_location === "wtf-component" && !this.currentlyExpanding && this.getVisibleIds().length <= 3 ? this.expandWhoToFollow(b, c) : a(b, c)
            })
        })
    }
    var _ = require("core/i18n"),
        utils = require("core/utils"),
        compose = require("core/compose"),
        ddg = require("app/data/ddg"),
        defineComponent = require("core/component"),
        withUserActions = require("app/ui/with_user_actions"),
        withItemActions = require("app/ui/with_item_actions"),
        withUserRecommendations = require("app/ui/who_to_follow/with_user_recommendations");
    module.exports = defineComponent(whoToFollowDashboard, withUserActions, withItemActions, withUserRecommendations)
});
define("app/ui/who_to_follow/who_to_follow_timeline", ["module", "require", "exports", "core/i18n", "core/utils", "core/compose", "core/component", "app/ui/with_user_actions", "app/ui/with_item_actions", "app/ui/who_to_follow/with_user_recommendations"], function(module, require, exports) {
    function whoToFollowTimeline() {
        this.defaultAttrs({
            doneButtonSelector: ".empty-timeline .js-done",
            headerTextSelector: ".empty-timeline .header-text",
            titles: {
                0: _('Here are some people you might enjoy following.'),
                1: _('Victory! That\u2019s 1.'),
                2: _('Congratulations! That\u2019s 2.'),
                3: _('Excellent! You\u2019re making progress.'),
                4: _('Good work! You\u2019ve almost reached 5.'),
                5: _('Yee-haw! That\u2019s 5 follows. Now you\u2019re on a roll.')
            }
        }), this.dismissAllRecommendations = function(a, b) {
            var c = $(b.el);
            if (c.is(":disabled")) return;
            var d = this.getVisibleIds();
            this.trigger("uiDidDismissEmptyTimelineRecommendations", {
                userIds: d
            }), this.trigger("uiDidHideEmptyTimelineModule"), this.$node.remove()
        }, this.refreshDoneButtonState = function() {
            var a = this.select("doneButtonSelector");
            a.attr("disabled", this.followingCount < 5)
        }, this.refreshTitle = function() {
            var a = this.attr.titles[this.followingCount.toString()];
            this.select("headerTextSelector").text(a)
        }, this.increaseFollowingCount = function() {
            this.followingCount++
        }, this.decreaseFollowingCount = function() {
            this.followingCount--
        }, this.initRecommendations = function() {
            this.followingCount = this.attr.wtfOptions.followingCount, this.verifyInitialRecommendations()
        }, this.after("initialize", function() {
            this.attr.wtfOptions = this.attr.emptyTimelineOptions || {}, this.on(document, "uiFollowAction", this.increaseFollowingCount), this.on(document, "uiUnfollowAction", this.decreaseFollowingCount), this.on(document, "dataFollowStateChange", this.refreshDoneButtonState), this.on(document, "dataFollowStateChange", this.refreshTitle), this.on(document, "uiSwiftLoaded uiPageChanged", this.initRecommendations), this.on("click", {
                doneButtonSelector: this.dismissAllRecommendations
            })
        })
    }
    var _ = require("core/i18n"),
        utils = require("core/utils"),
        compose = require("core/compose"),
        defineComponent = require("core/component"),
        withUserActions = require("app/ui/with_user_actions"),
        withItemActions = require("app/ui/with_item_actions"),
        withUserRecommendations = require("app/ui/who_to_follow/with_user_recommendations");
    module.exports = defineComponent(whoToFollowTimeline, withUserActions, withItemActions, withUserRecommendations)
});
define("app/data/who_to_follow", ["module", "require", "exports", "core/component", "core/utils", "core/compose", "app/utils/storage/custom", "app/data/with_data"], function(module, require, exports) {
    function whoToFollowData() {
        this.defaults = {
            maxExcludedRecsInLocalStorage: 100,
            endpoints: {
                users: {
                    url: "/i/users/recommendations",
                    method: "GET",
                    successEvent: "dataDidGetUserRecommendations",
                    errorEvent: "dataFailedToGetUserRecommendations"
                },
                dismiss: {
                    url: "/i/users/recommendations/hide",
                    method: "POST",
                    successEvent: "dataDidDismissRecommendation",
                    errorEvent: "dataFailedToDismissUserRecommendation"
                },
                promoted_self: {
                    url: "/i/users/promoted_self",
                    method: "GET",
                    successEvent: "dataDidGetSelfPromotedAccount",
                    errorEvent: "dataFailedToGetSelfPromotedAccount"
                }
            }
        }, this.refreshEndpoint = function(a) {
            return this.hitEndpoint(a, {
                "Cache-Control": "max-age=0",
                Pragma: "no-cache"
            })
        }, this.hitEndpoint = function(a, b) {
            var b = b || {}, c = this.defaults.endpoints[a];
            return function(a, d) {
                d = d || {}, d.excluded = d.excluded || [];
                var e = d.visible || [];
                delete d.visible, this.JSONRequest({
                    type: c.method,
                    url: c.url,
                    headers: b,
                    dataType: "json",
                    data: utils.merge(d, {
                        excluded: this.storage.pushAll("excluded", d.excluded).concat(e).join(",")
                    }),
                    eventData: d,
                    success: c.successEvent,
                    error: c.errorEvent
                }, c.method)
            }.bind(this)
        }, this.excludeUsers = function(a, b) {
            this.storage.pushAll("excluded", b.userIds), this.trigger("dataDidExcludeUserRecommendations", b)
        }, this.excludeFollowed = function(a, b) {
            b = b || {}, b.newState === "following" && b.userId && this.storage.push("excluded", b.userId)
        }, this.after("initialize", function(a) {
            var b = customStorage({
                withArray: !0,
                withMaxElements: !0,
                withUniqueElements: !0
            });
            this.storage = new b("excluded_wtf_recs"), this.storage.setMaxElements("excluded", this.attr.maxExcludedRecsInLocalStorage), this.on(document, "uiRefreshUserRecommendations", this.refreshEndpoint("users")), this.on(document, "uiGetUserRecommendations", this.hitEndpoint("users")), this.on(document, "uiDismissUserRecommendation", this.hitEndpoint("dismiss")), this.on(document, "uiDidDismissEmptyTimelineRecommendations", this.excludeUsers), this.on(document, "dataFollowStateChange", this.excludeFollowed), this.on(document, "uiGotPromptbirdDashboardProfile", this.hitEndpoint("promoted_self"))
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        compose = require("core/compose"),
        customStorage = require("app/utils/storage/custom"),
        withData = require("app/data/with_data"),
        WhoToFollowData = defineComponent(whoToFollowData, withData);
    module.exports = WhoToFollowData
});
define("app/data/who_to_follow_scribe", ["module", "require", "exports", "core/component", "app/ui/with_interaction_data", "app/data/with_interaction_data_scribe", "core/utils"], function(module, require, exports) {
    function whoToFollowScribe() {
        this.defaultAttrs({
            userSelector: ".js-actionable-user",
            itemType: "user"
        }), this.scribeDismissRecommendation = function(a, b) {
            this.scribeInteraction("dismiss", b.oldUser), b.newUser && this.scribeInteraction({
                element: "replace",
                action: "results"
            }, b.newUser, {
                referring_event: "replace"
            })
        }, this.scribeRecommendationResults = function(a, b) {
            var c = [];
            a.emptyResponse || this.$node.find(this.attr.userSelector).map(function(a, b) {
                c.push(this.interactionData($(b), {
                    position: a
                }))
            }.bind(this));
            var d = a.emptyResponse ? "no_results" : "results";
            this.scribeInteractiveResults({
                element: b,
                action: d
            }, c, a, {
                referring_event: b
            })
        }, this.scribeRecommendations = function(a, b) {
            var c = b.sourceEventData || {}, d = b.initialResults || c.initialResults;
            d ? (this.scribeRecommendationResults(b, "initial"), b.emptyResponse || this.scribeRecommendationImpression(b)) : (this.scribe({
                action: "refresh"
            }, b), this.scribeRecommendationResults(b, "newer"))
        }, this.scribeEmptyRecommendationsResponse = function(a, b) {
            this.scribeRecommendations(a, utils.merge(b, {
                emptyResponse: !0
            }))
        }, this.scribeRecommendationImpression = function(a) {
            this.scribe("impression", a)
        }, this.scribeLinkClicks = function(a, b) {
            this.scribe({
                component: "user_recommendations",
                element: b.element,
                action: "click"
            })
        }, this.after("initialize", function() {
            this.on(document, "uiDidDismissUserRecommendation", this.scribeDismissRecommendation), this.on(document, "uiDidGetRecommendations", this.scribeRecommendations), this.on(document, "uiGotEmptyRecommendationsResponse", this.scribeEmptyRecommendationsResponse), this.on(document, "uiClickedWtfLink", this.scribeLinkClicks)
        })
    }
    var defineComponent = require("core/component"),
        withInteractionData = require("app/ui/with_interaction_data"),
        withInteractionDataScribe = require("app/data/with_interaction_data_scribe"),
        utils = require("core/utils");
    module.exports = defineComponent(whoToFollowScribe, withInteractionData, withInteractionDataScribe)
});
define("app/ui/promptbird/with_invite_contacts", ["module", "require", "exports"], function(module, require, exports) {
    function withInviteContacts() {
        this.defaultAttrs({
            inviteContactsSelector: ".invite_contacts_prompt.prompt + .promptbird-action-bar .call-to-action"
        }), this.doInviteContacts = function(b, c) {
            b.preventDefault(), this.trigger("uiPromptbirdShowInviteContactsDialog")
        }, this.after("initialize", function() {
            this.on("click", {
                inviteContactsSelector: this.doInviteContacts
            })
        })
    }
    module.exports = withInviteContacts
});
define("app/ui/promptbird", ["module", "require", "exports", "core/component", "app/ui/promptbird/with_invite_contacts"], function(module, require, exports) {
    function promptbirdPrompt() {
        this.defaultAttrs({
            promptSelector: ".prompt",
            languageSelector: ".language",
            callToActionSelector: ".call-to-action",
            callToActionDismissSelector: ".call-to-action.dismiss-prompt",
            delayedDismissSelector: ".js-follow-btn",
            dismissSelector: "a.js-dismiss",
            setLanguageSelector: ".call-to-action.set-language",
            oneClickImportSelector: ".call-to-action.one-click-import-button",
            inlineImportButtonSelector: ".service-links a.service-link",
            dashboardProfilePromptSelector: ".gain_followers_prompt",
            previewPromotedAccountSelector: ".gain_followers_prompt .preview-promoted-account"
        }), this.importCallbackUrl = function() {
            return window.location.protocol + "//" + window.location.host + "/who_to_follow/matches"
        }, this.promptLanguage = function() {
            return this.select("languageSelector").attr("data-language")
        }, this.dismissPrompt = function(a, b) {
            a.preventDefault(), this.trigger("uiPromptbirdDismissPrompt", {
                scribeContext: {
                    component: "promptbird_" + this.$node.data("prompt-id")
                },
                prompt_id: this.$node.data("prompt-id")
            }), this.$node.remove()
        }, this.delayedDismissPrompt = function(b, c) {
            this.trigger("uiPromptbirdDismissPrompt", {
                prompt_id: this.$node.data("prompt-id")
            });
            var d = this.$node;
            setTimeout(function() {
                d.remove()
            }, 1e3)
        }, this.setLanguage = function(a, b) {
            this.trigger("uiPromptbirdSetLanguage", {
                lang: this.promptLanguage()
            })
        }, this.doOneClickImport = function(a, b) {
            a.preventDefault();
            var c = this.$node.find("span.one-click-import-button").data("email"),
                d = "/invitations/oauth_launch?email=" + encodeURIComponent(c),
                e = this.$node.data("prompt-id"),
                b = {
                    triggerEvent: !0,
                    url: d
                };
            e === 46 && (b.width = 880, b.height = 550), this.trigger("uiPromptbirdDoOneClickImport", b)
        }, this.doInlineContactImport = function(a, b) {
            a.preventDefault();
            var c = $(a.target);
            this.trigger("uiPromptbirdDoInlineContactImport", {
                url: c.data("url"),
                width: c.data("width"),
                height: c.data("height"),
                popup: c.data("popup"),
                serviceName: c.find("strong.service-name").data("service-id"),
                callbackUrl: this.importCallbackUrl()
            })
        }, this.clickAndDismissPrompt = function(a, b) {
            this.trigger("uiPromptbirdDismissPrompt", {
                scribeContext: {
                    component: "promptbird_" + this.$node.data("prompt-id")
                },
                prompt_id: this.$node.data("prompt-id")
            }), this.$node.remove()
        }, this.generateClickEvent = function(a, b) {
            this.trigger("uiPromptbirdClick", {
                scribeContext: {
                    component: "promptbird_" + this.$node.data("prompt-id")
                }
            })
        }, this.clickPreviewPromotedAccount = function(a, b) {
            a.preventDefault(), this.trigger("uiPromptbirdPreviewPromotedAccount", {
                scribeContext: {
                    component: "promptbird_" + this.$node.data("prompt-id")
                }
            })
        }, this.showDashboardProfilePrompt = function() {
            this.$node.slideDown("fast"), this.trigger("uiShowDashboardProfilePromptbird", {
                scribeContext: {
                    component: "promptbird_" + this.$node.data("prompt-id")
                }
            })
        }, this.maybeInitDashboardProfilePrompt = function() {
            if (this.select("dashboardProfilePromptSelector").length === 0) return;
            this.on(document, "uiDidGetRecommendations", function() {
                this.trigger("uiGotPromptbirdDashboardProfile"), this.on(document, "dataDidGetSelfPromotedAccount", this.showDashboardProfilePrompt)
            })
        }, this.after("initialize", function() {
            this.on("click", {
                callToActionSelector: this.generateClickEvent,
                callToActionDismissSelector: this.clickAndDismissPrompt,
                dismissSelector: this.dismissPrompt,
                delayedDismissSelector: this.delayedDismissPrompt,
                setLanguageSelector: this.setLanguage,
                oneClickImportSelector: this.doOneClickImport,
                inlineImportButtonSelector: this.doInlineContactImport,
                previewPromotedAccountSelector: this.clickPreviewPromotedAccount
            }), this.on(document, "uiPromptbirdInviteContactsSuccess", this.dismissPrompt), this.maybeInitDashboardProfilePrompt()
        })
    }
    var defineComponent = require("core/component"),
        withInviteContacts = require("app/ui/promptbird/with_invite_contacts");
    module.exports = defineComponent(promptbirdPrompt, withInviteContacts)
});
define("app/utils/oauth_popup", ["module", "require", "exports"], function(module, require, exports) {
    module.exports = function(a) {
        var b = a.url,
            c = b.indexOf("?") == -1 ? "?" : "&";
        a.callbackUrl ? b += c + "callback_hash=" + encodeURIComponent(a.callbackUrl) : a.triggerEvent && (b += c + "trigger_event=true");
        var d = $(window),
            e = window.screenY || window.screenTop || 0,
            f = window.screenX || window.screenLeft || 0,
            g = (d.height() - 500) / 2 + e,
            h = (d.width() - 500) / 2 + f,
            a = {
                width: a.width ? a.width : 500,
                height: a.height ? a.height : 500,
                top: g,
                left: h,
                toolbar: "no",
                location: "yes"
            }, i = $.param(a).replace(/&/g, ",");
        window.open(b, "twitter_oauth", i).focus()
    }
});
define("app/data/promptbird", ["module", "require", "exports", "core/component", "app/data/with_data", "app/utils/oauth_popup"], function(module, require, exports) {
    function promptbirdData() {
        this.languageChanged = function(a, b) {
            window.location.reload()
        }, this.changeLanguage = function(a, b) {
            var c = {
                lang: b.lang
            };
            this.post({
                url: "/settings/account/set_language",
                eventData: c,
                data: c,
                success: "dataPromptbirdLanguageChangeSuccess",
                error: "dataPromptbirdLanguageChangeFailure"
            })
        }, this.dismissPrompt = function(a, b) {
            var c = {
                prompt_id: b.prompt_id
            };
            this.post({
                url: "/users/dismiss_prompt",
                eventData: c,
                data: c,
                success: "dataPromptbirdPromptDismissed",
                error: "dataPromptbirdPromptDismissalError"
            })
        }, this.doOneClickImport = function(a, b) {
            oauthPopup(b), this.trigger("dataPromptbirdDidOneClickImport", b)
        }, this.doInlineContactImport = function(a, b) {
            var c = b.url;
            c && (b.popup ? oauthPopup({
                url: c,
                width: b.width,
                height: b.height,
                callbackUrl: b.callbackUrl
            }) : window.open(c, "_blank").focus())
        }, this.after("initialize", function() {
            this.on("uiPromptbirdSetLanguage", this.changeLanguage), this.on("uiPromptbirdDismissPrompt", this.dismissPrompt), this.on("uiPromptbirdDoOneClickImport", this.doOneClickImport), this.on("dataPromptbirdLanguageChangeSuccess", this.languageChanged), this.on("uiPromptbirdDoInlineContactImport", this.doInlineContactImport)
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data"),
        oauthPopup = require("app/utils/oauth_popup");
    module.exports = defineComponent(promptbirdData, withData)
});
define("app/data/promptbird_scribe", ["module", "require", "exports", "core/component", "app/data/with_scribe"], function(module, require, exports) {
    function promptbirdScribe() {
        this.after("initialize", function() {
            this.scribeOnEvent("uiPromptbirdClick", {
                action: "click"
            }), this.scribeOnEvent("uiPromptbirdPreviewPromotedAccount", {
                action: "preview"
            }), this.scribeOnEvent("uiPromptbirdDismissPrompt", {
                action: "dismiss"
            }), this.scribeOnEvent("uiShowDashboardProfilePromptbird", {
                action: "show"
            })
        })
    }
    var defineComponent = require("core/component"),
        withScribe = require("app/data/with_scribe");
    module.exports = defineComponent(promptbirdScribe, withScribe)
});
define("app/ui/with_select_all", ["module", "require", "exports", "core/i18n"], function(module, require, exports) {
    function withSelectAll() {
        this.defaultAttrs({}), this.checkboxChanged = function(a) {
            var b = this.select("checkboxSelector"),
                c = this.select("checkedCheckboxSelector");
            this.select("actionButtonSelector").attr("disabled", c.length == 0), this.select("selectAllSelector").attr("checked", c.length == b.length), this.trigger("uiListSelectionChanged")
        }, this.selectAllChanged = function() {
            var a = this.select("selectAllSelector");
            this.select("checkboxSelector").attr("checked", a.is(":checked")), this.select("actionButtonSelector").attr("disabled", !a.is(":checked")), this.trigger("uiListSelectionChanged")
        }, this.after("initialize", function() {
            this.attr.checkedCheckboxSelector = this.attr.checkboxSelector + ":checked", this.on("change", {
                checkboxSelector: this.checkboxChanged,
                selectAllSelector: this.selectAllChanged
            })
        })
    }
    var _ = require("core/i18n");
    module.exports = withSelectAll
});
define("app/ui/who_to_follow/with_invite_messages", ["module", "require", "exports", "core/i18n"], function(module, require, exports) {
    function withInviteMessages() {
        this.defaultAttrs({
            showMessageOnSuccess: !0
        }), this.showSuccessMessage = function(a, b) {
            var c = this.select("actionButtonSelector"),
                d = c.data("done-href");
            if (d) {
                this.trigger("uiNavigate", {
                    href: d
                });
                return
            }
            var e, f;
            b ? (e = b.invited.length, f = _('We let {{count}} of your contacts know about Twitter.', {
                count: e
            })) : (e = -1, f = _('We let your contacts know about Twitter.')), this.attr.showMessageOnSuccess && this.trigger("uiShowMessage", {
                message: f
            }), this.trigger("uiInviteFinished", {
                count: e
            })
        }, this.showFailureMessage = function(a, b) {
            var c = b.errors && b.errors[0] && b.errors[0].code;
            switch (c) {
                case 47:
                    this.trigger("uiShowError", {
                        message: _('We couldn\'t send invitations to any of those addresses.')
                    });
                    break;
                case 37:
                    this.trigger("uiShowError", {
                        message: _('There was an error emailing your contacts. Please try again later.')
                    });
                    break;
                default:
                    this.showSuccessMessage(a)
            }
        }, this.after("initialize", function() {
            this.on(document, "dataInviteContactsSuccess", this.showSuccessMessage), this.on(document, "dataInviteContactsFailure", this.showFailureMessage)
        })
    }
    var _ = require("core/i18n");
    module.exports = withInviteMessages
});
define("app/ui/who_to_follow/with_invite_preview", ["module", "require", "exports"], function(module, require, exports) {
    function withInvitePreview() {
        this.defaultAttrs({
            previewInviteSelector: ".js-preview-invite"
        }), this.previewInvite = function(a, b) {
            a.preventDefault(), window.open("/invitations/email_preview", "invitation_email_preview", "height=550,width=740"), this.trigger("uiPreviewInviteOpened")
        }, this.after("initialize", function() {
            this.on("click", {
                previewInviteSelector: this.previewInvite
            })
        })
    }
    module.exports = withInvitePreview
});
define("app/ui/who_to_follow/with_unmatched_contacts", ["module", "require", "exports", "core/compose", "app/ui/with_select_all", "app/ui/who_to_follow/with_invite_messages", "app/ui/who_to_follow/with_invite_preview"], function(module, require, exports) {
    function withUnmatchedContacts() {
        compose.mixin(this, [withSelectAll, withInviteMessages, withInvitePreview]), this.defaultAttrs({
            checkboxSelector: ".contact-checkbox",
            selectAllSelector: ".select-all-contacts",
            actionButtonSelector: ".js-invite"
        }), this.inviteChecked = function() {
            var a = [],
                b = this.select("checkedCheckboxSelector");
            b.each(function() {
                var b = $(this),
                    c = b.closest("label").find(".contact-item-name").text(),
                    d = {
                        email: b.val()
                    };
                c != d.email && (d.name = c), a.push(d)
            }), this.select("actionButtonSelector").attr("disabled", !0), this.trigger("uiInviteContacts", {
                invitable: this.select("checkboxSelector").length,
                contacts: a,
                scribeContext: {
                    component: this.attr.inviteContactsComponent
                }
            })
        }, this.reenableActionButton = function() {
            this.select("actionButtonSelector").attr("disabled", !1)
        }, this.after("initialize", function() {
            this.on("change", {
                checkboxSelector: this.checkboxChanged,
                selectAllSelector: this.selectAllChanged
            }), this.on("click", {
                actionButtonSelector: this.inviteChecked
            }), this.on(document, "dataInviteContactsSuccess dataInviteContactsFailure", this.reenableActionButton)
        })
    }
    var compose = require("core/compose"),
        withSelectAll = require("app/ui/with_select_all"),
        withInviteMessages = require("app/ui/who_to_follow/with_invite_messages"),
        withInvitePreview = require("app/ui/who_to_follow/with_invite_preview");
    module.exports = withUnmatchedContacts
});
define("app/ui/dialogs/promptbird_invite_contacts_dialog", ["module", "require", "exports", "core/component", "app/ui/with_position", "app/ui/with_dialog", "app/ui/who_to_follow/with_unmatched_contacts"], function(module, require, exports) {
    function promptbirdInviteContactsDialog() {
        this.defaultAttrs({
            contactSelector: ".contact-item",
            inviteContactsComponent: "invite_contacts_promptbird"
        }), this.contactCheckboxChanged = function(a) {
            var b = $(a.target);
            b.closest(this.attr.contactSelector).toggleClass("selected", b.is(":checked"))
        }, this.contactSelectAllChanged = function() {
            var a = this.select("selectAllSelector");
            this.select("contactSelector").toggleClass("selected", a.is(":checked"))
        }, this.inviteSuccess = function(a, b) {
            this.close(), this.trigger("uiPromptbirdInviteContactsSuccess")
        }, this.after("initialize", function() {
            this.on("change", {
                checkboxSelector: this.contactCheckboxChanged,
                selectAllSelector: this.contactSelectAllChanged
            }), this.on(document, "uiPromptbirdShowInviteContactsDialog", this.open), this.on(document, "uiInviteFinished", this.inviteSuccess), this.on(document, "dataInviteContactsFailure", this.close)
        })
    }
    var defineComponent = require("core/component"),
        withPosition = require("app/ui/with_position"),
        withDialog = require("app/ui/with_dialog"),
        withUnmatchedContacts = require("app/ui/who_to_follow/with_unmatched_contacts");
    module.exports = defineComponent(promptbirdInviteContactsDialog, withDialog, withPosition, withUnmatchedContacts)
});
define("app/data/contact_import", ["module", "require", "exports", "core/component", "app/data/with_data"], function(module, require, exports) {
    function contactImportData() {
        this.contactImportStatus = function(a, b) {
            this.get({
                url: "/who_to_follow/import/status",
                data: {},
                eventData: b,
                success: "dataContactImportStatusSuccess",
                error: "dataContactImportStatusFailure"
            })
        }, this.contactImportFollow = function(a, b) {
            var c = {
                user_ids: b.includeIds || [],
                unchecked_user_ids: b.excludeIds || []
            };
            this.post({
                url: "/find_sources/contacts/follow_some.json",
                data: c,
                eventData: b,
                headers: {
                    "X-PHX": !0
                },
                success: this.handleContactImportSuccess.bind(this),
                error: "dataContactImportFollowFailure"
            })
        }, this.handleContactImportSuccess = function(a) {
            a.followed_ids.forEach(function(a) {
                this.trigger("dataBulkFollowStateChange", {
                    userId: a,
                    newState: "following"
                })
            }.bind(this)), a.requested_ids.forEach(function(a) {
                this.trigger("dataBulkFollowStateChange", {
                    userId: a,
                    newState: "pending"
                })
            }.bind(this)), this.trigger("dataContactImportFollowSuccess", a)
        }, this.inviteContacts = function(a, b) {
            var c = b.contacts.map(function(a) {
                return a.name ? '"' + a.name.replace(/"/g, '\\"') + '" <' + a.email + ">" : a.email
            });
            this.post({
                url: "/users/send_invites_by_email",
                data: {
                    addresses: c.join(","),
                    source: "contact_import"
                },
                eventData: b,
                success: "dataInviteContactsSuccess",
                error: "dataInviteContactsFailure"
            })
        }, this.wipeAddressbook = function(a, b) {
            this.post({
                url: "/users/wipe_addressbook.json",
                headers: {
                    "X-PHX": !0
                },
                data: {},
                eventData: b,
                success: "dataWipeAddressbookSuccess",
                error: "dataWipeAddressbookFailure"
            })
        }, this.unmatchedContacts = function(a, b) {
            this.get({
                url: "/welcome/unmatched_contacts",
                data: {},
                eventData: b,
                success: "dataUnmatchedContactsSuccess",
                error: "dataUnmatchedContactsFailure"
            })
        }, this.after("initialize", function() {
            this.on(document, "uiWantsContactImportStatus", this.contactImportStatus), this.on(document, "uiContactImportFollow", this.contactImportFollow), this.on(document, "uiWantsUnmatchedContacts", this.unmatchedContacts), this.on(document, "uiInviteContacts", this.inviteContacts), this.on(document, "uiWantsAddressbookWiped", this.wipeAddressbook)
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data");
    module.exports = defineComponent(contactImportData, withData)
});
define("app/data/contact_import_scribe", ["module", "require", "exports", "core/component", "core/utils", "app/data/with_scribe"], function(module, require, exports) {
    function contactImportScribe() {
        this.scribeServiceLaunch = function(a, b) {
            this.scribe({
                component: "import_service_stream",
                action: "launch_service"
            }, {
                query: b.service
            })
        }, this.scribePreviewInviteOpened = function(a, b) {
            this.scribe({
                component: "invite_friends",
                element: "preview_invite_link",
                action: "click"
            })
        }, this.scribeFollowSuccess = function(a, b) {
            this.scribe({
                component: "stream_header",
                action: "follow"
            }, {
                item_count: b.followed_ids.length,
                item_ids: b.followed_ids,
                event_value: b.followed_ids.length,
                event_info: "follow_all"
            })
        }, this.scribeInvitationSuccess = function(a, b) {
            var c = b.sourceEventData,
                d = b.sourceEventData.scribeContext;
            c.invitable !== undefined && this.scribe(utils.merge({}, d, {
                action: "invitable"
            }), {
                item_count: c.invitable
            }), this.scribe(utils.merge({}, d, {
                action: "invited"
            }), {
                item_count: c.contacts.length,
                event_value: c.contacts.length
            })
        }, this.scribeInvitationFailure = function(a, b) {
            var c = b.sourceEventData,
                d = b.sourceEventData.scribeContext,
                e = b.errors && b.errors[0] && b.errors[0].code;
            this.scribe(utils.merge({}, d, {
                action: "error"
            }), {
                item_count: c.contacts.length,
                status_code: e
            })
        }, this.scribeLinkClick = function(a, b) {
            var c = a.target.className;
            c.indexOf("find-friends-link") != -1 && this.scribe({
                element: "find_friends_link",
                action: "click"
            })
        }, this.after("initialize", function() {
            this.on("uiImportServiceLaunched", this.scribeServiceLaunch), this.on("uiPreviewInviteOpened", this.scribePreviewInviteOpened), this.on("dataContactImportFollowSuccess", this.scribeFollowSuccess), this.on("dataInviteContactsSuccess", this.scribeInvitationSuccess), this.on("dataInviteContactsFailure", this.scribeInvitationFailure), this.on("click", this.scribeLinkClick)
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        withScribe = require("app/data/with_scribe");
    module.exports = defineComponent(contactImportScribe, withScribe)
});
define("app/ui/with_import_services", ["module", "require", "exports", "core/i18n", "app/utils/oauth_popup"], function(module, require, exports) {
    function withImportServices() {
        this.launchService = function(a) {
            var b = $(a.target).closest(this.attr.launchServiceSelector);
            this.oauthPopup({
                url: b.data("url"),
                triggerEvent: !0,
                width: b.data("width"),
                height: b.data("height")
            }), this.trigger("uiImportServiceLaunched", {
                service: b.data("service")
            })
        }, this.importDeniedFailure = function() {
            this.trigger("uiShowError", {
                message: _('You denied Twitter\'s access to your contact information.')
            })
        }, this.importMissingFailure = function() {
            this.trigger("uiShowError", {
                message: _('An error occurred validating your credentials.')
            })
        }, this.after("initialize", function() {
            this.oauthPopup = oauthPopup, this.on(document, "uiOauthImportDenied", this.importDeniedFailure), this.on(document, "uiOauthImportMissing", this.importMissingFailure), this.on("click", {
                launchServiceSelector: this.launchService
            })
        })
    }
    var _ = require("core/i18n"),
        oauthPopup = require("app/utils/oauth_popup");
    module.exports = withImportServices
});
define("app/ui/who_to_follow/import_services", ["module", "require", "exports", "core/component", "core/i18n", "app/ui/with_import_services"], function(module, require, exports) {
    function importServices() {
        this.defaultAttrs({
            launchServiceSelector: ".js-service-row",
            matchesHref: "/who_to_follow/matches"
        }), this.importSuccess = function() {
            this.trigger("uiOpenImportLoadingDialog"), this.startPolling()
        }, this.dialogCancelled = function() {
            this.stopPolling()
        }, this.startPolling = function() {
            this.pollingCount = 0, this.interval = window.setInterval(this.checkForContacts.bind(this), 3e3)
        }, this.stopPolling = function() {
            this.interval && (window.clearInterval(this.interval), this.interval = null), this.trigger("uiCloseDialog")
        }, this.checkForContacts = function() {
            this.pollingCount++ > 15 ? (this.trigger("uiShowError", {
                message: _('Loading seems to be taking a while. Please wait a moment and try again.')
            }), this.stopPolling()) : this.trigger("uiWantsContactImportStatus")
        }, this.hasStatus = function(a, b) {
            b.done && (this.stopPolling(), b.error ? this.trigger("uiShowError", {
                message: b.message
            }) : this.trigger("uiNavigate", {
                href: this.attr.matchesHref
            }))
        }, this.after("initialize", function() {
            this.on(document, "uiOauthImportSuccess", this.importSuccess), this.on(document, "uiImportLoadingDialogCancelled", this.dialogCancelled), this.on(document, "dataContactImportStatusSuccess", this.hasStatus)
        }), this.after("teardown", function() {
            this.stopPolling()
        })
    }
    var defineComponent = require("core/component"),
        _ = require("core/i18n"),
        withImportServices = require("app/ui/with_import_services");
    module.exports = defineComponent(importServices, withImportServices)
});
define("app/ui/who_to_follow/import_loading_dialog", ["module", "require", "exports", "core/component", "app/ui/with_position", "app/ui/with_dialog"], function(module, require, exports) {
    function importLoadingDialog() {
        this.defaultAttrs({
            closeSelector: ".modal-close"
        }), this.after("afterClose", function() {
            this.trigger("uiImportLoadingDialogCancelled")
        }), this.after("initialize", function() {
            this.on(document, "uiOpenImportLoadingDialog", this.open)
        })
    }
    var defineComponent = require("core/component"),
        withPosition = require("app/ui/with_position"),
        withDialog = require("app/ui/with_dialog");
    module.exports = defineComponent(importLoadingDialog, withDialog, withPosition)
});
define("app/ui/dashboard_tweetbox", ["module", "require", "exports", "core/component", "core/utils"], function(module, require, exports) {
    function dashboardTweetbox() {
        this.defaultAttrs({
            hasDefaultText: !0,
            tweetFormSelector: ".tweet-form",
            defaultTextFrom: "data-screen-name",
            prependText: "@"
        }), this.openTweetBox = function() {
            var a = this.attr.prependText,
                b = this.$node.attr(this.attr.defaultTextFrom) || "",
                c = this.select("tweetFormSelector");
            this.trigger(c, "uiInitTweetbox", utils.merge({
                draftTweetId: this.attr.draftTweetId,
                condensable: !0,
                condensedText: a + b,
                defaultText: this.attr.hasDefaultText ? a + b + " " : ""
            }, {
                eventData: this.attr.eventData
            }))
        }, this.after("initialize", function() {
            this.openTweetBox()
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils");
    module.exports = defineComponent(dashboardTweetbox)
});
define("app/utils/boomerang", ["module", "require", "exports", "core/component", "core/clock", "app/data/scribe_transport"], function(module, require, exports) {
    function Boomerang() {
        this.initializeBoomerang = function() {
            var a = {
                allow_ssl: !0,
                autorun: !1,
                user_ip: this.attr.ip,
                BW: {
                    base_url: this.attr.baseUrl,
                    cookie: this.attr.force ? null : "BA"
                }
            }, b = function(a) {
                (a && a.bw || this.attr.inTest) && this.scribeBoomerangResults(a);
                try {
                    delete window.BOOMR
                } catch (b) {
                    window.BOOMR = undefined
                }
            }.bind(this);
            using("app/utils/boomerang_lib", function() {
                delete BOOMR.plugins.RT, BOOMR.init(a), BOOMR.subscribe("before_beacon", b), clock.setTimeoutEvent("boomerangStart", 1e4)
            })
        }, this.scribeBoomerangResults = function(a) {
            var b = parseInt(a.bw / 1024, 10),
                c = parseInt(a.bw_err * 100 / a.bw, 10),
                d = parseInt(a.lat_err * 100 / a.lat, 10);
            scribeTransport.send({
                event_name: "measurement",
                load_time_ms: a.t_done,
                bandwidth_kbytes: b,
                bandwidth_error_percent: c,
                latency_ms: a.lat,
                latency_error_percent: d,
                product: "webclient",
                base_url: this.attr.baseUrl
            }, "boomerang"), this.attr.force && this.trigger("uiShowError", {
                message: "Bandwidth: " + b + " KB/s &plusmn; " + c + "%<br />Latency: " + a.lat + " ms &plusmn; " + a.lat_err
            })
        }, this.startBoomerang = function() {
            BOOMR.page_ready()
        }, this.after("initialize", function() {
            this.on(window, "load", this.initializeBoomerang), this.on("boomerangStart", this.startBoomerang)
        })
    }
    var defineComponent = require("core/component"),
        clock = require("core/clock"),
        scribeTransport = require("app/data/scribe_transport");
    module.exports = defineComponent(Boomerang)
});
define("app/ui/profile_stats", ["module", "require", "exports", "core/component", "app/ui/with_profile_stats"], function(module, require, exports) {
    var defineComponent = require("core/component"),
        withProfileStats = require("app/ui/with_profile_stats");
    module.exports = defineComponent(withProfileStats)
});
define("app/pages/home", ["module", "require", "exports", "app/boot/app", "app/boot/trends", "app/boot/tweet_timeline", "app/ui/who_to_follow/who_to_follow_dashboard", "app/ui/who_to_follow/who_to_follow_timeline", "app/data/who_to_follow", "app/data/who_to_follow_scribe", "app/ui/promptbird", "app/data/promptbird", "app/data/promptbird_scribe", "app/ui/dialogs/promptbird_invite_contacts_dialog", "app/data/contact_import", "app/data/contact_import_scribe", "app/data/contact_import", "app/ui/who_to_follow/import_services", "app/ui/who_to_follow/import_loading_dialog", "app/ui/dashboard_tweetbox", "app/utils/boomerang", "core/utils", "core/i18n", "app/ui/profile_stats"], function(module, require, exports) {
    var bootApp = require("app/boot/app"),
        trendsBoot = require("app/boot/trends"),
        tweetTimelineBoot = require("app/boot/tweet_timeline"),
        WhoToFollowDashboard = require("app/ui/who_to_follow/who_to_follow_dashboard"),
        WhoToFollowTimeline = require("app/ui/who_to_follow/who_to_follow_timeline"),
        WhoToFollowData = require("app/data/who_to_follow"),
        WhoToFollowScribe = require("app/data/who_to_follow_scribe"),
        PromptbirdUI = require("app/ui/promptbird"),
        PromptbirdData = require("app/data/promptbird"),
        PromptbirdScribe = require("app/data/promptbird_scribe"),
        PromptbirdInviteContactsDialog = require("app/ui/dialogs/promptbird_invite_contacts_dialog"),
        ContactImport = require("app/data/contact_import"),
        ContactImportScribe = require("app/data/contact_import_scribe"),
        ContactImportData = require("app/data/contact_import"),
        ImportServices = require("app/ui/who_to_follow/import_services"),
        ImportLoadingDialog = require("app/ui/who_to_follow/import_loading_dialog"),
        DashboardTweetbox = require("app/ui/dashboard_tweetbox"),
        Boomerang = require("app/utils/boomerang"),
        utils = require("core/utils"),
        _ = require("core/i18n"),
        ProfileStats = require("app/ui/profile_stats");
    module.exports = function(a) {
        bootApp(a), trendsBoot(a), tweetTimelineBoot(a, a.timeline_url, "tweet", "tweet");
        var b = utils.merge(a, {
            eventData: {
                scribeContext: {
                    component: "user_recommendations"
                }
            }
        }),
            c = ".promptbird",
            d = utils.merge(a, {
                eventData: {
                    scribeContext: {
                        section: "home"
                    }
                }
            });
        PromptbirdData.attachTo(document, d), PromptbirdUI.attachTo(c, d), PromptbirdScribe.attachTo(c, d);
        var e = $(c).data("prompt-id");
        e === 46 || e === 49 || e === 50 ? (ContactImportData.attachTo(document), ContactImportScribe.attachTo(document), ImportServices.attachTo(c), ImportLoadingDialog.attachTo("#import-loading-dialog")) : e === 223 && (PromptbirdInviteContactsDialog.attachTo("#promptbird-invite-contacts-dialog", d), ContactImport.attachTo(document, d), ContactImportScribe.attachTo(document, d)), WhoToFollowDashboard.attachTo(".dashboard .js-wtf-module", b), WhoToFollowScribe.attachTo(".dashboard .js-wtf-module", b), a.emptyTimelineOptions.emptyTimelineModule && WhoToFollowTimeline.attachTo("#empty-timeline-recommendations", b), WhoToFollowScribe.attachTo("#empty-timeline-recommendations", b), WhoToFollowData.attachTo(document, b), DashboardTweetbox.attachTo(".home-tweet-box", {
            draftTweetId: "home",
            prependText: _('Compose new Tweet...'),
            hasDefaultText: !1,
            eventData: {
                scribeContext: {
                    component: "tweet_box"
                }
            }
        }), ProfileStats.attachTo(".dashboard .mini-profile"), a.boomr && Boomerang.attachTo(document, a.boomr)
    }
});
define("app/boot/wtf_module", ["module", "require", "exports", "app/ui/who_to_follow/who_to_follow_dashboard", "app/data/who_to_follow", "app/data/who_to_follow_scribe", "core/utils"], function(module, require, exports) {
    var WhoToFollowDashboard = require("app/ui/who_to_follow/who_to_follow_dashboard"),
        WhoToFollowData = require("app/data/who_to_follow"),
        WhoToFollowScribe = require("app/data/who_to_follow_scribe"),
        utils = require("core/utils");
    module.exports = function(b) {
        var c = utils.merge(b, {
            eventData: {
                scribeContext: {
                    component: "user_recommendations"
                }
            }
        });
        WhoToFollowDashboard.attachTo(".dashboard .js-wtf-module", c), WhoToFollowData.attachTo(document, c), WhoToFollowScribe.attachTo(".dashboard .js-wtf-module", c)
    }
});
define("app/boot/connect", ["module", "require", "exports", "app/boot/app", "app/boot/trends", "app/boot/wtf_module"], function(module, require, exports) {
    function initialize(a) {
        bootApp(a), whoToFollowModule(a), a.showTrends && bootTrends(a)
    }
    var bootApp = require("app/boot/app"),
        bootTrends = require("app/boot/trends"),
        whoToFollowModule = require("app/boot/wtf_module"),
        wtfSelector = ".dashboard .js-wtf-module",
        timelineSelector = "#timeline";
    module.exports = initialize
});
define("app/pages/connect/interactions", ["module", "require", "exports", "app/boot/connect", "app/boot/tweet_timeline", "app/data/contact_import_scribe"], function(module, require, exports) {
    var connectBoot = require("app/boot/connect"),
        tweetTimelineBoot = require("app/boot/tweet_timeline"),
        ContactImportScribe = require("app/data/contact_import_scribe");
    module.exports = function(a) {
        connectBoot(a), tweetTimelineBoot(a, "/i/connect/timeline", "activity", "stream"), ContactImportScribe.attachTo(".empty-connect", a)
    }
});
define("app/pages/connect/mentions", ["module", "require", "exports", "app/boot/connect", "app/boot/tweet_timeline"], function(module, require, exports) {
    var connectBoot = require("app/boot/connect"),
        tweetTimelineBoot = require("app/boot/tweet_timeline");
    module.exports = function(a) {
        connectBoot(a), tweetTimelineBoot(a, "/mentions/timeline", "tweet")
    }
});
define("app/pages/connect/network_activity", ["module", "require", "exports", "app/boot/connect", "app/boot/tweet_timeline"], function(module, require, exports) {
    var connectBoot = require("app/boot/connect"),
        tweetTimelineBoot = require("app/boot/tweet_timeline");
    module.exports = function(a) {
        a.containingItemSelector = ".supplement", a.marginBreaking = !1, connectBoot(a), tweetTimelineBoot(a, "/activity/timeline", "activity", "stream")
    }
});
define("app/ui/inline_edit", ["module", "require", "exports", "core/component"], function(module, require, exports) {
    function inlineEdit() {
        this.defaultAttrs({
            editableFieldSelector: ".editable-field",
            profileFieldSelector: ".profile-field",
            padding: 15
        }), this.syncWidth = function() {
            var a = this.measureDimensions(this.currentText()).width + this.padding;
            this.$editableField.width(a)
        }, this.syncHeight = function() {
            var a = this.measureDimensions(this.currentText()).height,
                b = Math.ceil(a / this.lineHeight);
            this.$editableField.attr("rows", b)
        }, this.saveOldValues = function() {
            this.oldTextValue = this.editableFieldValue(), this.oldHtmlValue = this.$profileField.html()
        }, this.resetToOldValues = function() {
            this.$editableField.val(this.oldTextValue), this.$profileField.html(this.oldHtmlValue)
        }, this.syncValue = function() {
            var a = this.editableFieldValue();
            this.oldTextValue !== a && (this.$profileField.text(a), this.trigger("uiInlineEditSave", {
                newValue: a,
                field: this.$editableField.attr("name")
            }))
        }, this.currentText = function() {
            return this.editableFieldValue() || this.getPlaceholderText()
        }, this.editableFieldValue = function() {
            return this.$editableField.val()
        }, this.addPadding = function() {
            this.padding = this.attr.padding, this.syncWidth()
        }, this.removePadding = function() {
            this.padding = 0, this.syncWidth()
        }, this.measureDimensions = function(a) {
            var b = this.$profileField.clone();
            b.text(a), this.$profileField.replaceWith(b);
            var c = b.width(),
                d = b.height();
            return b.replaceWith(this.$profileField), {
                width: c,
                height: d
            }
        }, this.preventNewline = function(a) {
            a.keyCode === 13 && (a.preventDefault(), a.stopImmediatePropagation())
        }, this.getPlaceholderText = function() {
            return this.$editableField.attr("placeholder")
        }, this.after("initialize", function() {
            this.$editableField = this.select("editableFieldSelector"), this.$profileField = this.select("profileFieldSelector"), this.lineHeight = parseInt(this.$profileField.css("line-height"), 10), this.removePadding(), this.on(document, "uiEditProfileSaveFields", this.syncValue), this.on(document, "uiEditProfileStart", this.saveOldValues), this.on(document, "uiEditProfileCancel", this.resetToOldValues), this.$editableField.is("input") ? (this.on(this.$editableField, "keyup keydown blur update", this.syncWidth), this.on(this.$editableField, "focus", this.addPadding), this.on(this.$editableField, "blur", this.removePadding), this.on(document, "uiEditProfileStart", this.syncWidth)) : this.$editableField.is("textarea") && (this.on(this.$editableField, "keydown", this.preventNewline), this.on(this.$editableField, "keyup keydown blur update", this.syncHeight), this.on(document, "uiEditProfileStart", this.syncHeight))
        })
    }
    var defineComponent = require("core/component");
    module.exports = defineComponent(inlineEdit)
});
define("app/data/async_profile", ["module", "require", "exports", "core/component", "app/data/with_data"], function(module, require, exports) {
    function asyncProfileData() {
        this.saveField = function(a, b) {
            this.fields[b.field] = b.newValue
        }, this.clearFields = function() {
            this.fields = {}
        }, this.saveFields = function(a, b) {
            function c(a) {
                if (a.error === !0) return d.call(this, a);
                this.trigger("dataInlineEditSaveSuccess", a), this.clearFields()
            }
            function d(a) {
                this.trigger("dataInlineEditSaveError", a), this.clearFields()
            }
            a.preventDefault(), Object.keys(this.fields).length > 0 ? (this.trigger("dataInlineEditSaveStarted", {}), this.post({
                url: "i/profiles/update",
                data: this.fields,
                eventData: b,
                success: c.bind(this),
                error: d.bind(this)
            })) : this.trigger("dataInlineEditSaveSuccess")
        }, this.after("initialize", function() {
            this.fields = {}, this.on("uiInlineEditSave", this.saveField), this.on("uiEditProfileSave", this.saveFields)
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data");
    module.exports = defineComponent(asyncProfileData, withData)
});
deferred('$lib/jquery_ui.profile.js', function() {
    /*! jQuery UI 1.8.22 (c) 2012 http://jqueryui.com/about http://jquery.org/license */
    (function($, a) {
        function b(a, b) {
            var d = a.nodeName.toLowerCase();
            if ("area" === d) {
                var e = a.parentNode,
                    f = e.name,
                    g;
                return !a.href || !f || e.nodeName.toLowerCase() !== "map" ? !1 : (g = $("img[usemap=#" + f + "]")[0], !! g && c(g))
            }
            return (/input|select|textarea|button|object/.test(d) ? !a.disabled : "a" == d ? a.href || b : b) && c(a)
        }
        function c(a) {
            return !$(a).parents().andSelf().filter(function() {
                return $.curCSS(this, "visibility") === "hidden" || $.expr.filters.hidden(this)
            }).length
        }
        $.ui = $.ui || {};
        if ($.ui.version) return;
        $.extend($.ui, {
            version: "1.8.22",
            keyCode: {
                ALT: 18,
                BACKSPACE: 8,
                CAPS_LOCK: 20,
                COMMA: 188,
                COMMAND: 91,
                COMMAND_LEFT: 91,
                COMMAND_RIGHT: 93,
                CONTROL: 17,
                DELETE: 46,
                DOWN: 40,
                END: 35,
                ENTER: 13,
                ESCAPE: 27,
                HOME: 36,
                INSERT: 45,
                LEFT: 37,
                MENU: 93,
                NUMPAD_ADD: 107,
                NUMPAD_DECIMAL: 110,
                NUMPAD_DIVIDE: 111,
                NUMPAD_ENTER: 108,
                NUMPAD_MULTIPLY: 106,
                NUMPAD_SUBTRACT: 109,
                PAGE_DOWN: 34,
                PAGE_UP: 33,
                PERIOD: 190,
                RIGHT: 39,
                SHIFT: 16,
                SPACE: 32,
                TAB: 9,
                UP: 38,
                WINDOWS: 91
            }
        }), $.fn.extend({
            propAttr: $.fn.prop || $.fn.attr,
            _focus: $.fn.focus,
            focus: function(a, b) {
                return typeof a == "number" ? this.each(function() {
                    var c = this;
                    setTimeout(function() {
                        $(c).focus(), b && b.call(c)
                    }, a)
                }) : this._focus.apply(this, arguments)
            },
            scrollParent: function() {
                var a;
                return $.browser.msie && /(static|relative)/.test(this.css("position")) || /absolute/.test(this.css("position")) ? a = this.parents().filter(function() {
                    return /(relative|absolute|fixed)/.test($.curCSS(this, "position", 1)) && /(auto|scroll)/.test($.curCSS(this, "overflow", 1) + $.curCSS(this, "overflow-y", 1) + $.curCSS(this, "overflow-x", 1))
                }).eq(0) : a = this.parents().filter(function() {
                    return /(auto|scroll)/.test($.curCSS(this, "overflow", 1) + $.curCSS(this, "overflow-y", 1) + $.curCSS(this, "overflow-x", 1))
                }).eq(0), /fixed/.test(this.css("position")) || !a.length ? $(document) : a
            },
            zIndex: function(b) {
                if (b !== a) return this.css("zIndex", b);
                if (this.length) {
                    var c = $(this[0]),
                        d, e;
                    while (c.length && c[0] !== document) {
                        d = c.css("position");
                        if (d === "absolute" || d === "relative" || d === "fixed") {
                            e = parseInt(c.css("zIndex"), 10);
                            if (!isNaN(e) && e !== 0) return e
                        }
                        c = c.parent()
                    }
                }
                return 0
            },
            disableSelection: function() {
                return this.bind(($.support.selectstart ? "selectstart" : "mousedown") + ".ui-disableSelection", function(a) {
                    a.preventDefault()
                })
            },
            enableSelection: function() {
                return this.unbind(".ui-disableSelection")
            }
        }), $("<a>").outerWidth(1).jquery || $.each(["Width", "Height"], function(b, c) {
            function g(a, b, c, e) {
                return $.each(d, function() {
                    b -= parseFloat($.curCSS(a, "padding" + this, !0)) || 0, c && (b -= parseFloat($.curCSS(a, "border" + this + "Width", !0)) || 0), e && (b -= parseFloat($.curCSS(a, "margin" + this, !0)) || 0)
                }), b
            }
            var d = c === "Width" ? ["Left", "Right"] : ["Top", "Bottom"],
                e = c.toLowerCase(),
                f = {
                    innerWidth: $.fn.innerWidth,
                    innerHeight: $.fn.innerHeight,
                    outerWidth: $.fn.outerWidth,
                    outerHeight: $.fn.outerHeight
                };
            $.fn["inner" + c] = function(b) {
                return b === a ? f["inner" + c].call(this) : this.each(function() {
                    $(this).css(e, g(this, b) + "px")
                })
            }, $.fn["outer" + c] = function(a, b) {
                return typeof a != "number" ? f["outer" + c].call(this, a) : this.each(function() {
                    $(this).css(e, g(this, a, !0, b) + "px")
                })
            }
        }), $.extend($.expr[":"], {
            data: $.expr.createPseudo ? $.expr.createPseudo(function(a) {
                return function(b) {
                    return !!$.data(b, a)
                }
            }) : function(a, b, c) {
                return !!$.data(a, c[3])
            },
            focusable: function(a) {
                return b(a, !isNaN($.attr(a, "tabindex")))
            },
            tabbable: function(a) {
                var c = $.attr(a, "tabindex"),
                    d = isNaN(c);
                return (d || c >= 0) && b(a, !d)
            }
        }), $(function() {
            var a = document.body,
                b = a.appendChild(b = document.createElement("div"));
            b.offsetHeight, $.extend(b.style, {
                minHeight: "100px",
                height: "auto",
                padding: 0,
                borderWidth: 0
            }), $.support.minHeight = b.offsetHeight === 100, $.support.selectstart = "onselectstart" in b, a.removeChild(b).style.display = "none"
        }), $.curCSS || ($.curCSS = $.css), $.extend($.ui, {
            plugin: {
                add: function(a, b, c) {
                    var d = $.ui[a].prototype;
                    for (var e in c) d.plugins[e] = d.plugins[e] || [], d.plugins[e].push([b, c[e]])
                },
                call: function(a, b, c) {
                    var d = a.plugins[b];
                    if (!d || !a.element[0].parentNode) return;
                    for (var e = 0; e < d.length; e++) a.options[d[e][0]] && d[e][1].apply(a.element, c)
                }
            },
            contains: function(a, b) {
                return document.compareDocumentPosition ? a.compareDocumentPosition(b) & 16 : a !== b && a.contains(b)
            },
            hasScroll: function(a, b) {
                if ($(a).css("overflow") === "hidden") return !1;
                var c = b && b === "left" ? "scrollLeft" : "scrollTop",
                    d = !1;
                return a[c] > 0 ? !0 : (a[c] = 1, d = a[c] > 0, a[c] = 0, d)
            },
            isOverAxis: function(a, b, c) {
                return a > b && a < b + c
            },
            isOver: function(a, b, c, d, e, f) {
                return $.ui.isOverAxis(a, c, e) && $.ui.isOverAxis(b, d, f)
            }
        })
    })(jQuery),
    function($, a) {
        if ($.cleanData) {
            var b = $.cleanData;
            $.cleanData = function(a) {
                for (var c = 0, d;
                (d = a[c]) != null; c++) try {
                    $(d).triggerHandler("remove")
                } catch (e) {}
                b(a)
            }
        } else {
            var c = $.fn.remove;
            $.fn.remove = function(a, b) {
                return this.each(function() {
                    return b || (!a || $.filter(a, [this]).length) && $("*", this).add([this]).each(function() {
                        try {
                            $(this).triggerHandler("remove")
                        } catch (a) {}
                    }), c.call($(this), a, b)
                })
            }
        }
        $.widget = function(a, b, c) {
            var d = a.split(".")[0],
                e;
            a = a.split(".")[1], e = d + "-" + a, c || (c = b, b = $.Widget), $.expr[":"][e] = function(b) {
                return !!$.data(b, a)
            }, $[d] = $[d] || {}, $[d][a] = function(a, b) {
                arguments.length && this._createWidget(a, b)
            };
            var f = new b;
            f.options = $.extend(!0, {}, f.options), $[d][a].prototype = $.extend(!0, f, {
                namespace: d,
                widgetName: a,
                widgetEventPrefix: $[d][a].prototype.widgetEventPrefix || a,
                widgetBaseClass: e
            }, c), $.widget.bridge(a, $[d][a])
        }, $.widget.bridge = function(b, c) {
            $.fn[b] = function(d) {
                var e = typeof d == "string",
                    f = Array.prototype.slice.call(arguments, 1),
                    g = this;
                return d = !e && f.length ? $.extend.apply(null, [!0, d].concat(f)) : d, e && d.charAt(0) === "_" ? g : (e ? this.each(function() {
                    var c = $.data(this, b),
                        e = c && $.isFunction(c[d]) ? c[d].apply(c, f) : c;
                    if (e !== c && e !== a) return g = e, !1
                }) : this.each(function() {
                    var a = $.data(this, b);
                    a ? a.option(d || {})._init() : $.data(this, b, new c(d, this))
                }), g)
            }
        }, $.Widget = function(a, b) {
            arguments.length && this._createWidget(a, b)
        }, $.Widget.prototype = {
            widgetName: "widget",
            widgetEventPrefix: "",
            options: {
                disabled: !1
            },
            _createWidget: function(a, b) {
                $.data(b, this.widgetName, this), this.element = $(b), this.options = $.extend(!0, {}, this.options, this._getCreateOptions(), a);
                var c = this;
                this.element.bind("remove." + this.widgetName, function() {
                    c.destroy()
                }), this._create(), this._trigger("create"), this._init()
            },
            _getCreateOptions: function() {
                return $.metadata && $.metadata.get(this.element[0])[this.widgetName]
            },
            _create: function() {},
            _init: function() {},
            destroy: function() {
                this.element.unbind("." + this.widgetName).removeData(this.widgetName), this.widget().unbind("." + this.widgetName).removeAttr("aria-disabled").removeClass(this.widgetBaseClass + "-disabled " + "ui-state-disabled")
            },
            widget: function() {
                return this.element
            },
            option: function(b, c) {
                var d = b;
                if (arguments.length === 0) return $.extend({}, this.options);
                if (typeof b == "string") {
                    if (c === a) return this.options[b];
                    d = {}, d[b] = c
                }
                return this._setOptions(d), this
            },
            _setOptions: function(a) {
                var b = this;
                return $.each(a, function(a, c) {
                    b._setOption(a, c)
                }), this
            },
            _setOption: function(a, b) {
                return this.options[a] = b, a === "disabled" && this.widget()[b ? "addClass" : "removeClass"](this.widgetBaseClass + "-disabled" + " " + "ui-state-disabled").attr("aria-disabled", b), this
            },
            enable: function() {
                return this._setOption("disabled", !1)
            },
            disable: function() {
                return this._setOption("disabled", !0)
            },
            _trigger: function(a, b, c) {
                var d, e, f = this.options[a];
                c = c || {}, b = $.Event(b), b.type = (a === this.widgetEventPrefix ? a : this.widgetEventPrefix + a).toLowerCase(), b.target = this.element[0], e = b.originalEvent;
                if (e) for (d in e) d in b || (b[d] = e[d]);
                return this.element.trigger(b, c), !($.isFunction(f) && f.call(this.element[0], b, c) === !1 || b.isDefaultPrevented())
            }
        }
    }(jQuery),
    function($, a) {
        var b = !1;
        $(document).mouseup(function(a) {
            b = !1
        }), $.widget("ui.mouse", {
            options: {
                cancel: ":input,option",
                distance: 1,
                delay: 0
            },
            _mouseInit: function() {
                var a = this;
                this.element.bind("mousedown." + this.widgetName, function(b) {
                    return a._mouseDown(b)
                }).bind("click." + this.widgetName, function(b) {
                    if (!0 === $.data(b.target, a.widgetName + ".preventClickEvent")) return $.removeData(b.target, a.widgetName + ".preventClickEvent"), b.stopImmediatePropagation(), !1
                }), this.started = !1
            },
            _mouseDestroy: function() {
                this.element.unbind("." + this.widgetName), $(document).unbind("mousemove." + this.widgetName, this._mouseMoveDelegate).unbind("mouseup." + this.widgetName, this._mouseUpDelegate)
            },
            _mouseDown: function(a) {
                if (b) return;
                this._mouseStarted && this._mouseUp(a), this._mouseDownEvent = a;
                var c = this,
                    d = a.which == 1,
                    e = typeof this.options.cancel == "string" && a.target.nodeName ? $(a.target).closest(this.options.cancel).length : !1;
                if (!d || e || !this._mouseCapture(a)) return !0;
                this.mouseDelayMet = !this.options.delay, this.mouseDelayMet || (this._mouseDelayTimer = setTimeout(function() {
                    c.mouseDelayMet = !0
                }, this.options.delay));
                if (this._mouseDistanceMet(a) && this._mouseDelayMet(a)) {
                    this._mouseStarted = this._mouseStart(a) !== !1;
                    if (!this._mouseStarted) return a.preventDefault(), !0
                }
                return !0 === $.data(a.target, this.widgetName + ".preventClickEvent") && $.removeData(a.target, this.widgetName + ".preventClickEvent"), this._mouseMoveDelegate = function(a) {
                    return c._mouseMove(a)
                }, this._mouseUpDelegate = function(a) {
                    return c._mouseUp(a)
                }, $(document).bind("mousemove." + this.widgetName, this._mouseMoveDelegate).bind("mouseup." + this.widgetName, this._mouseUpDelegate), a.preventDefault(), b = !0, !0
            },
            _mouseMove: function(a) {
                return !$.browser.msie || document.documentMode >= 9 || !! a.button ? this._mouseStarted ? (this._mouseDrag(a), a.preventDefault()) : (this._mouseDistanceMet(a) && this._mouseDelayMet(a) && (this._mouseStarted = this._mouseStart(this._mouseDownEvent, a) !== !1, this._mouseStarted ? this._mouseDrag(a) : this._mouseUp(a)), !this._mouseStarted) : this._mouseUp(a)
            },
            _mouseUp: function(a) {
                return $(document).unbind("mousemove." + this.widgetName, this._mouseMoveDelegate).unbind("mouseup." + this.widgetName, this._mouseUpDelegate), this._mouseStarted && (this._mouseStarted = !1, a.target == this._mouseDownEvent.target && $.data(a.target, this.widgetName + ".preventClickEvent", !0), this._mouseStop(a)), !1
            },
            _mouseDistanceMet: function(a) {
                return Math.max(Math.abs(this._mouseDownEvent.pageX - a.pageX), Math.abs(this._mouseDownEvent.pageY - a.pageY)) >= this.options.distance
            },
            _mouseDelayMet: function(a) {
                return this.mouseDelayMet
            },
            _mouseStart: function(a) {},
            _mouseDrag: function(a) {},
            _mouseStop: function(a) {},
            _mouseCapture: function(a) {
                return !0
            }
        })
    }(jQuery),
    function($, a) {
        $.widget("ui.draggable", $.ui.mouse, {
            widgetEventPrefix: "drag",
            options: {
                addClasses: !0,
                appendTo: "parent",
                axis: !1,
                connectToSortable: !1,
                containment: !1,
                cursor: "auto",
                cursorAt: !1,
                grid: !1,
                handle: !1,
                helper: "original",
                iframeFix: !1,
                opacity: !1,
                refreshPositions: !1,
                revert: !1,
                revertDuration: 500,
                scope: "default",
                scroll: !0,
                scrollSensitivity: 20,
                scrollSpeed: 20,
                snap: !1,
                snapMode: "both",
                snapTolerance: 20,
                stack: !1,
                zIndex: !1
            },
            _create: function() {
                this.options.helper == "original" && !/^(?:r|a|f)/.test(this.element.css("position")) && (this.element[0].style.position = "relative"), this.options.addClasses && this.element.addClass("ui-draggable"), this.options.disabled && this.element.addClass("ui-draggable-disabled"), this._mouseInit()
            },
            destroy: function() {
                if (!this.element.data("draggable")) return;
                return this.element.removeData("draggable").unbind(".draggable").removeClass("ui-draggable ui-draggable-dragging ui-draggable-disabled"), this._mouseDestroy(), this
            },
            _mouseCapture: function(a) {
                var b = this.options;
                return this.helper || b.disabled || $(a.target).is(".ui-resizable-handle") ? !1 : (this.handle = this._getHandle(a), this.handle ? (b.iframeFix && $(b.iframeFix === !0 ? "iframe" : b.iframeFix).each(function() {
                    $('<div class="ui-draggable-iframeFix" style="background: #fff;"></div>').css({
                        width: this.offsetWidth + "px",
                        height: this.offsetHeight + "px",
                        position: "absolute",
                        opacity: "0.001",
                        zIndex: 1e3
                    }).css($(this).offset()).appendTo("body")
                }), !0) : !1)
            },
            _mouseStart: function(a) {
                var b = this.options;
                return this.helper = this._createHelper(a), this.helper.addClass("ui-draggable-dragging"), this._cacheHelperProportions(), $.ui.ddmanager && ($.ui.ddmanager.current = this), this._cacheMargins(), this.cssPosition = this.helper.css("position"), this.scrollParent = this.helper.scrollParent(), this.offset = this.positionAbs = this.element.offset(), this.offset = {
                    top: this.offset.top - this.margins.top,
                    left: this.offset.left - this.margins.left
                }, $.extend(this.offset, {
                    click: {
                        left: a.pageX - this.offset.left,
                        top: a.pageY - this.offset.top
                    },
                    parent: this._getParentOffset(),
                    relative: this._getRelativeOffset()
                }), this.originalPosition = this.position = this._generatePosition(a), this.originalPageX = a.pageX, this.originalPageY = a.pageY, b.cursorAt && this._adjustOffsetFromHelper(b.cursorAt), b.containment && this._setContainment(), this._trigger("start", a) === !1 ? (this._clear(), !1) : (this._cacheHelperProportions(), $.ui.ddmanager && !b.dropBehaviour && $.ui.ddmanager.prepareOffsets(this, a), this._mouseDrag(a, !0), $.ui.ddmanager && $.ui.ddmanager.dragStart(this, a), !0)
            },
            _mouseDrag: function(a, b) {
                this.position = this._generatePosition(a), this.positionAbs = this._convertPositionTo("absolute");
                if (!b) {
                    var c = this._uiHash();
                    if (this._trigger("drag", a, c) === !1) return this._mouseUp({}), !1;
                    this.position = c.position
                }
                if (!this.options.axis || this.options.axis != "y") this.helper[0].style.left = this.position.left + "px";
                if (!this.options.axis || this.options.axis != "x") this.helper[0].style.top = this.position.top + "px";
                return $.ui.ddmanager && $.ui.ddmanager.drag(this, a), !1
            },
            _mouseStop: function(a) {
                var b = !1;
                $.ui.ddmanager && !this.options.dropBehaviour && (b = $.ui.ddmanager.drop(this, a)), this.dropped && (b = this.dropped, this.dropped = !1);
                var c = this.element[0],
                    d = !1;
                while (c && (c = c.parentNode)) c == document && (d = !0);
                if (!d && this.options.helper === "original") return !1;
                if (this.options.revert == "invalid" && !b || this.options.revert == "valid" && b || this.options.revert === !0 || $.isFunction(this.options.revert) && this.options.revert.call(this.element, b)) {
                    var e = this;
                    $(this.helper).animate(this.originalPosition, parseInt(this.options.revertDuration, 10), function() {
                        e._trigger("stop", a) !== !1 && e._clear()
                    })
                } else this._trigger("stop", a) !== !1 && this._clear();
                return !1
            },
            _mouseUp: function(a) {
                return this.options.iframeFix === !0 && $("div.ui-draggable-iframeFix").each(function() {
                    this.parentNode.removeChild(this)
                }), $.ui.ddmanager && $.ui.ddmanager.dragStop(this, a), $.ui.mouse.prototype._mouseUp.call(this, a)
            },
            cancel: function() {
                return this.helper.is(".ui-draggable-dragging") ? this._mouseUp({}) : this._clear(), this
            },
            _getHandle: function(a) {
                var b = !this.options.handle || !$(this.options.handle, this.element).length ? !0 : !1;
                return $(this.options.handle, this.element).find("*").andSelf().each(function() {
                    this == a.target && (b = !0)
                }), b
            },
            _createHelper: function(a) {
                var b = this.options,
                    c = $.isFunction(b.helper) ? $(b.helper.apply(this.element[0], [a])) : b.helper == "clone" ? this.element.clone().removeAttr("id") : this.element;
                return c.parents("body").length || c.appendTo(b.appendTo == "parent" ? this.element[0].parentNode : b.appendTo), c[0] != this.element[0] && !/(fixed|absolute)/.test(c.css("position")) && c.css("position", "absolute"), c
            },
            _adjustOffsetFromHelper: function(a) {
                typeof a == "string" && (a = a.split(" ")), $.isArray(a) && (a = {
                    left: +a[0],
                    top: +a[1] || 0
                }), "left" in a && (this.offset.click.left = a.left + this.margins.left), "right" in a && (this.offset.click.left = this.helperProportions.width - a.right + this.margins.left), "top" in a && (this.offset.click.top = a.top + this.margins.top), "bottom" in a && (this.offset.click.top = this.helperProportions.height - a.bottom + this.margins.top)
            },
            _getParentOffset: function() {
                this.offsetParent = this.helper.offsetParent();
                var a = this.offsetParent.offset();
                this.cssPosition == "absolute" && this.scrollParent[0] != document && $.ui.contains(this.scrollParent[0], this.offsetParent[0]) && (a.left += this.scrollParent.scrollLeft(), a.top += this.scrollParent.scrollTop());
                if (this.offsetParent[0] == document.body || this.offsetParent[0].tagName && this.offsetParent[0].tagName.toLowerCase() == "html" && $.browser.msie) a = {
                    top: 0,
                    left: 0
                };
                return {
                    top: a.top + (parseInt(this.offsetParent.css("borderTopWidth"), 10) || 0),
                    left: a.left + (parseInt(this.offsetParent.css("borderLeftWidth"), 10) || 0)
                }
            },
            _getRelativeOffset: function() {
                if (this.cssPosition == "relative") {
                    var a = this.element.position();
                    return {
                        top: a.top - (parseInt(this.helper.css("top"), 10) || 0) + this.scrollParent.scrollTop(),
                        left: a.left - (parseInt(this.helper.css("left"), 10) || 0) + this.scrollParent.scrollLeft()
                    }
                }
                return {
                    top: 0,
                    left: 0
                }
            },
            _cacheMargins: function() {
                this.margins = {
                    left: parseInt(this.element.css("marginLeft"), 10) || 0,
                    top: parseInt(this.element.css("marginTop"), 10) || 0,
                    right: parseInt(this.element.css("marginRight"), 10) || 0,
                    bottom: parseInt(this.element.css("marginBottom"), 10) || 0
                }
            },
            _cacheHelperProportions: function() {
                this.helperProportions = {
                    width: this.helper.outerWidth(),
                    height: this.helper.outerHeight()
                }
            },
            _setContainment: function() {
                var a = this.options;
                a.containment == "parent" && (a.containment = this.helper[0].parentNode);
                if (a.containment == "document" || a.containment == "window") this.containment = [a.containment == "document" ? 0 : $(window).scrollLeft() - this.offset.relative.left - this.offset.parent.left, a.containment == "document" ? 0 : $(window).scrollTop() - this.offset.relative.top - this.offset.parent.top, (a.containment == "document" ? 0 : $(window).scrollLeft()) + $(a.containment == "document" ? document : window).width() - this.helperProportions.width - this.margins.left, (a.containment == "document" ? 0 : $(window).scrollTop()) + ($(a.containment == "document" ? document : window).height() || document.body.parentNode.scrollHeight) - this.helperProportions.height - this.margins.top];
                if (!/^(document|window|parent)$/.test(a.containment) && a.containment.constructor != Array) {
                    var b = $(a.containment),
                        c = b[0];
                    if (!c) return;
                    var d = b.offset(),
                        e = $(c).css("overflow") != "hidden";
                    this.containment = [(parseInt($(c).css("borderLeftWidth"), 10) || 0) + (parseInt($(c).css("paddingLeft"), 10) || 0), (parseInt($(c).css("borderTopWidth"), 10) || 0) + (parseInt($(c).css("paddingTop"), 10) || 0), (e ? Math.max(c.scrollWidth, c.offsetWidth) : c.offsetWidth) - (parseInt($(c).css("borderLeftWidth"), 10) || 0) - (parseInt($(c).css("paddingRight"), 10) || 0) - this.helperProportions.width - this.margins.left - this.margins.right, (e ? Math.max(c.scrollHeight, c.offsetHeight) : c.offsetHeight) - (parseInt($(c).css("borderTopWidth"), 10) || 0) - (parseInt($(c).css("paddingBottom"), 10) || 0) - this.helperProportions.height - this.margins.top - this.margins.bottom], this.relative_container = b
                } else a.containment.constructor == Array && (this.containment = a.containment)
            },
            _convertPositionTo: function(a, b) {
                b || (b = this.position);
                var c = a == "absolute" ? 1 : -1,
                    d = this.options,
                    e = this.cssPosition != "absolute" || this.scrollParent[0] != document && !! $.ui.contains(this.scrollParent[0], this.offsetParent[0]) ? this.scrollParent : this.offsetParent,
                    f = /(html|body)/i.test(e[0].tagName);
                return {
                    top: b.top + this.offset.relative.top * c + this.offset.parent.top * c - ($.browser.safari && $.browser.version < 526 && this.cssPosition == "fixed" ? 0 : (this.cssPosition == "fixed" ? -this.scrollParent.scrollTop() : f ? 0 : e.scrollTop()) * c),
                    left: b.left + this.offset.relative.left * c + this.offset.parent.left * c - ($.browser.safari && $.browser.version < 526 && this.cssPosition == "fixed" ? 0 : (this.cssPosition == "fixed" ? -this.scrollParent.scrollLeft() : f ? 0 : e.scrollLeft()) * c)
                }
            },
            _generatePosition: function(a) {
                var b = this.options,
                    c = this.cssPosition != "absolute" || this.scrollParent[0] != document && !! $.ui.contains(this.scrollParent[0], this.offsetParent[0]) ? this.scrollParent : this.offsetParent,
                    d = /(html|body)/i.test(c[0].tagName),
                    e = a.pageX,
                    f = a.pageY;
                if (this.originalPosition) {
                    var g;
                    if (this.containment) {
                        if (this.relative_container) {
                            var h = this.relative_container.offset();
                            g = [this.containment[0] + h.left, this.containment[1] + h.top, this.containment[2] + h.left, this.containment[3] + h.top]
                        } else g = this.containment;
                        a.pageX - this.offset.click.left < g[0] && (e = g[0] + this.offset.click.left), a.pageY - this.offset.click.top < g[1] && (f = g[1] + this.offset.click.top), a.pageX - this.offset.click.left > g[2] && (e = g[2] + this.offset.click.left), a.pageY - this.offset.click.top > g[3] && (f = g[3] + this.offset.click.top)
                    }
                    if (b.grid) {
                        var i = b.grid[1] ? this.originalPageY + Math.round((f - this.originalPageY) / b.grid[1]) * b.grid[1] : this.originalPageY;
                        f = g ? i - this.offset.click.top < g[1] || i - this.offset.click.top > g[3] ? i - this.offset.click.top < g[1] ? i + b.grid[1] : i - b.grid[1] : i : i;
                        var j = b.grid[0] ? this.originalPageX + Math.round((e - this.originalPageX) / b.grid[0]) * b.grid[0] : this.originalPageX;
                        e = g ? j - this.offset.click.left < g[0] || j - this.offset.click.left > g[2] ? j - this.offset.click.left < g[0] ? j + b.grid[0] : j - b.grid[0] : j : j
                    }
                }
                return {
                    top: f - this.offset.click.top - this.offset.relative.top - this.offset.parent.top + ($.browser.safari && $.browser.version < 526 && this.cssPosition == "fixed" ? 0 : this.cssPosition == "fixed" ? -this.scrollParent.scrollTop() : d ? 0 : c.scrollTop()),
                    left: e - this.offset.click.left - this.offset.relative.left - this.offset.parent.left + ($.browser.safari && $.browser.version < 526 && this.cssPosition == "fixed" ? 0 : this.cssPosition == "fixed" ? -this.scrollParent.scrollLeft() : d ? 0 : c.scrollLeft())
                }
            },
            _clear: function() {
                this.helper.removeClass("ui-draggable-dragging"), this.helper[0] != this.element[0] && !this.cancelHelperRemoval && this.helper.remove(), this.helper = null, this.cancelHelperRemoval = !1
            },
            _trigger: function(a, b, c) {
                return c = c || this._uiHash(), $.ui.plugin.call(this, a, [b, c]), a == "drag" && (this.positionAbs = this._convertPositionTo("absolute")), $.Widget.prototype._trigger.call(this, a, b, c)
            },
            plugins: {},
            _uiHash: function(a) {
                return {
                    helper: this.helper,
                    position: this.position,
                    originalPosition: this.originalPosition,
                    offset: this.positionAbs
                }
            }
        }), $.extend($.ui.draggable, {
            version: "1.8.22"
        }), $.ui.plugin.add("draggable", "connectToSortable", {
            start: function(a, b) {
                var c = $(this).data("draggable"),
                    d = c.options,
                    e = $.extend({}, b, {
                        item: c.element
                    });
                c.sortables = [], $(d.connectToSortable).each(function() {
                    var b = $.data(this, "sortable");
                    b && !b.options.disabled && (c.sortables.push({
                        instance: b,
                        shouldRevert: b.options.revert
                    }), b.refreshPositions(), b._trigger("activate", a, e))
                })
            },
            stop: function(a, b) {
                var c = $(this).data("draggable"),
                    d = $.extend({}, b, {
                        item: c.element
                    });
                $.each(c.sortables, function() {
                    this.instance.isOver ? (this.instance.isOver = 0, c.cancelHelperRemoval = !0, this.instance.cancelHelperRemoval = !1, this.shouldRevert && (this.instance.options.revert = !0), this.instance._mouseStop(a), this.instance.options.helper = this.instance.options._helper, c.options.helper == "original" && this.instance.currentItem.css({
                        top: "auto",
                        left: "auto"
                    })) : (this.instance.cancelHelperRemoval = !1, this.instance._trigger("deactivate", a, d))
                })
            },
            drag: function(a, b) {
                var c = $(this).data("draggable"),
                    d = this,
                    e = function(a) {
                        var b = this.offset.click.top,
                            c = this.offset.click.left,
                            d = this.positionAbs.top,
                            e = this.positionAbs.left,
                            f = a.height,
                            g = a.width,
                            h = a.top,
                            i = a.left;
                        return $.ui.isOver(d + b, e + c, h, i, f, g)
                    };
                $.each(c.sortables, function(e) {
                    this.instance.positionAbs = c.positionAbs, this.instance.helperProportions = c.helperProportions, this.instance.offset.click = c.offset.click, this.instance._intersectsWith(this.instance.containerCache) ? (this.instance.isOver || (this.instance.isOver = 1, this.instance.currentItem = $(d).clone().removeAttr("id").appendTo(this.instance.element).data("sortable-item", !0), this.instance.options._helper = this.instance.options.helper, this.instance.options.helper = function() {
                        return b.helper[0]
                    }, a.target = this.instance.currentItem[0], this.instance._mouseCapture(a, !0), this.instance._mouseStart(a, !0, !0), this.instance.offset.click.top = c.offset.click.top, this.instance.offset.click.left = c.offset.click.left, this.instance.offset.parent.left -= c.offset.parent.left - this.instance.offset.parent.left, this.instance.offset.parent.top -= c.offset.parent.top - this.instance.offset.parent.top, c._trigger("toSortable", a), c.dropped = this.instance.element, c.currentItem = c.element, this.instance.fromOutside = c), this.instance.currentItem && this.instance._mouseDrag(a)) : this.instance.isOver && (this.instance.isOver = 0, this.instance.cancelHelperRemoval = !0, this.instance.options.revert = !1, this.instance._trigger("out", a, this.instance._uiHash(this.instance)), this.instance._mouseStop(a, !0), this.instance.options.helper = this.instance.options._helper, this.instance.currentItem.remove(), this.instance.placeholder && this.instance.placeholder.remove(), c._trigger("fromSortable", a), c.dropped = !1)
                })
            }
        }), $.ui.plugin.add("draggable", "cursor", {
            start: function(a, b) {
                var c = $("body"),
                    d = $(this).data("draggable").options;
                c.css("cursor") && (d._cursor = c.css("cursor")), c.css("cursor", d.cursor)
            },
            stop: function(a, b) {
                var c = $(this).data("draggable").options;
                c._cursor && $("body").css("cursor", c._cursor)
            }
        }), $.ui.plugin.add("draggable", "opacity", {
            start: function(a, b) {
                var c = $(b.helper),
                    d = $(this).data("draggable").options;
                c.css("opacity") && (d._opacity = c.css("opacity")), c.css("opacity", d.opacity)
            },
            stop: function(a, b) {
                var c = $(this).data("draggable").options;
                c._opacity && $(b.helper).css("opacity", c._opacity)
            }
        }), $.ui.plugin.add("draggable", "scroll", {
            start: function(a, b) {
                var c = $(this).data("draggable");
                c.scrollParent[0] != document && c.scrollParent[0].tagName != "HTML" && (c.overflowOffset = c.scrollParent.offset())
            },
            drag: function(a, b) {
                var c = $(this).data("draggable"),
                    d = c.options,
                    e = !1;
                if (c.scrollParent[0] != document && c.scrollParent[0].tagName != "HTML") {
                    if (!d.axis || d.axis != "x") c.overflowOffset.top + c.scrollParent[0].offsetHeight - a.pageY < d.scrollSensitivity ? c.scrollParent[0].scrollTop = e = c.scrollParent[0].scrollTop + d.scrollSpeed : a.pageY - c.overflowOffset.top < d.scrollSensitivity && (c.scrollParent[0].scrollTop = e = c.scrollParent[0].scrollTop - d.scrollSpeed);
                    if (!d.axis || d.axis != "y") c.overflowOffset.left + c.scrollParent[0].offsetWidth - a.pageX < d.scrollSensitivity ? c.scrollParent[0].scrollLeft = e = c.scrollParent[0].scrollLeft + d.scrollSpeed : a.pageX - c.overflowOffset.left < d.scrollSensitivity && (c.scrollParent[0].scrollLeft = e = c.scrollParent[0].scrollLeft - d.scrollSpeed)
                } else {
                    if (!d.axis || d.axis != "x") a.pageY - $(document).scrollTop() < d.scrollSensitivity ? e = $(document).scrollTop($(document).scrollTop() - d.scrollSpeed) : $(window).height() - (a.pageY - $(document).scrollTop()) < d.scrollSensitivity && (e = $(document).scrollTop($(document).scrollTop() + d.scrollSpeed));
                    if (!d.axis || d.axis != "y") a.pageX - $(document).scrollLeft() < d.scrollSensitivity ? e = $(document).scrollLeft($(document).scrollLeft() - d.scrollSpeed) : $(window).width() - (a.pageX - $(document).scrollLeft()) < d.scrollSensitivity && (e = $(document).scrollLeft($(document).scrollLeft() + d.scrollSpeed))
                }
                e !== !1 && $.ui.ddmanager && !d.dropBehaviour && $.ui.ddmanager.prepareOffsets(c, a)
            }
        }), $.ui.plugin.add("draggable", "snap", {
            start: function(a, b) {
                var c = $(this).data("draggable"),
                    d = c.options;
                c.snapElements = [], $(d.snap.constructor != String ? d.snap.items || ":data(draggable)" : d.snap).each(function() {
                    var a = $(this),
                        b = a.offset();
                    this != c.element[0] && c.snapElements.push({
                        item: this,
                        width: a.outerWidth(),
                        height: a.outerHeight(),
                        top: b.top,
                        left: b.left
                    })
                })
            },
            drag: function(a, b) {
                var c = $(this).data("draggable"),
                    d = c.options,
                    e = d.snapTolerance,
                    f = b.offset.left,
                    g = f + c.helperProportions.width,
                    h = b.offset.top,
                    i = h + c.helperProportions.height;
                for (var j = c.snapElements.length - 1; j >= 0; j--) {
                    var k = c.snapElements[j].left,
                        l = k + c.snapElements[j].width,
                        m = c.snapElements[j].top,
                        n = m + c.snapElements[j].height;
                    if (!(k - e < f && f < l + e && m - e < h && h < n + e || k - e < f && f < l + e && m - e < i && i < n + e || k - e < g && g < l + e && m - e < h && h < n + e || k - e < g && g < l + e && m - e < i && i < n + e)) {
                        c.snapElements[j].snapping && c.options.snap.release && c.options.snap.release.call(c.element, a, $.extend(c._uiHash(), {
                            snapItem: c.snapElements[j].item
                        })), c.snapElements[j].snapping = !1;
                        continue
                    }
                    if (d.snapMode != "inner") {
                        var o = Math.abs(m - i) <= e,
                            p = Math.abs(n - h) <= e,
                            q = Math.abs(k - g) <= e,
                            r = Math.abs(l - f) <= e;
                        o && (b.position.top = c._convertPositionTo("relative", {
                            top: m - c.helperProportions.height,
                            left: 0
                        }).top - c.margins.top), p && (b.position.top = c._convertPositionTo("relative", {
                            top: n,
                            left: 0
                        }).top - c.margins.top), q && (b.position.left = c._convertPositionTo("relative", {
                            top: 0,
                            left: k - c.helperProportions.width
                        }).left - c.margins.left), r && (b.position.left = c._convertPositionTo("relative", {
                            top: 0,
                            left: l
                        }).left - c.margins.left)
                    }
                    var s = o || p || q || r;
                    if (d.snapMode != "outer") {
                        var o = Math.abs(m - h) <= e,
                            p = Math.abs(n - i) <= e,
                            q = Math.abs(k - f) <= e,
                            r = Math.abs(l - g) <= e;
                        o && (b.position.top = c._convertPositionTo("relative", {
                            top: m,
                            left: 0
                        }).top - c.margins.top), p && (b.position.top = c._convertPositionTo("relative", {
                            top: n - c.helperProportions.height,
                            left: 0
                        }).top - c.margins.top), q && (b.position.left = c._convertPositionTo("relative", {
                            top: 0,
                            left: k
                        }).left - c.margins.left), r && (b.position.left = c._convertPositionTo("relative", {
                            top: 0,
                            left: l - c.helperProportions.width
                        }).left - c.margins.left)
                    }!c.snapElements[j].snapping && (o || p || q || r || s) && c.options.snap.snap && c.options.snap.snap.call(c.element, a, $.extend(c._uiHash(), {
                        snapItem: c.snapElements[j].item
                    })), c.snapElements[j].snapping = o || p || q || r || s
                }
            }
        }), $.ui.plugin.add("draggable", "stack", {
            start: function(a, b) {
                var c = $(this).data("draggable").options,
                    d = $.makeArray($(c.stack)).sort(function(a, b) {
                        return (parseInt($(a).css("zIndex"), 10) || 0) - (parseInt($(b).css("zIndex"), 10) || 0)
                    });
                if (!d.length) return;
                var e = parseInt(d[0].style.zIndex) || 0;
                $(d).each(function(a) {
                    this.style.zIndex = e + a
                }), this[0].style.zIndex = e + d.length
            }
        }), $.ui.plugin.add("draggable", "zIndex", {
            start: function(a, b) {
                var c = $(b.helper),
                    d = $(this).data("draggable").options;
                c.css("zIndex") && (d._zIndex = c.css("zIndex")), c.css("zIndex", d.zIndex)
            },
            stop: function(a, b) {
                var c = $(this).data("draggable").options;
                c._zIndex && $(b.helper).css("zIndex", c._zIndex)
            }
        })
    }(jQuery),
    function($, a) {
        var b = 5;
        $.widget("ui.slider", $.ui.mouse, {
            widgetEventPrefix: "slide",
            options: {
                animate: !1,
                distance: 0,
                max: 100,
                min: 0,
                orientation: "horizontal",
                range: !1,
                step: 1,
                value: 0,
                values: null
            },
            _create: function() {
                var a = this,
                    c = this.options,
                    d = this.element.find(".ui-slider-handle").addClass("ui-state-default ui-corner-all"),
                    e = "<a class='ui-slider-handle ui-state-default ui-corner-all' href='#'></a>",
                    f = c.values && c.values.length || 1,
                    g = [];
                this._keySliding = !1, this._mouseSliding = !1, this._animateOff = !0, this._handleIndex = null, this._detectOrientation(), this._mouseInit(), this.element.addClass("ui-slider ui-slider-" + this.orientation + " ui-widget" + " ui-widget-content" + " ui-corner-all" + (c.disabled ? " ui-slider-disabled ui-disabled" : "")), this.range = $([]), c.range && (c.range === !0 && (c.values || (c.values = [this._valueMin(), this._valueMin()]), c.values.length && c.values.length !== 2 && (c.values = [c.values[0], c.values[0]])), this.range = $("<div></div>").appendTo(this.element).addClass("ui-slider-range ui-widget-header" + (c.range === "min" || c.range === "max" ? " ui-slider-range-" + c.range : "")));
                for (var h = d.length; h < f; h += 1) g.push(e);
                this.handles = d.add($(g.join("")).appendTo(a.element)), this.handle = this.handles.eq(0), this.handles.add(this.range).filter("a").click(function(a) {
                    a.preventDefault()
                }).hover(function() {
                    c.disabled || $(this).addClass("ui-state-hover")
                }, function() {
                    $(this).removeClass("ui-state-hover")
                }).focus(function() {
                    c.disabled ? $(this).blur() : ($(".ui-slider .ui-state-focus").removeClass("ui-state-focus"), $(this).addClass("ui-state-focus"))
                }).blur(function() {
                    $(this).removeClass("ui-state-focus")
                }), this.handles.each(function(a) {
                    $(this).data("index.ui-slider-handle", a)
                }), this.handles.keydown(function(c) {
                    var d = $(this).data("index.ui-slider-handle"),
                        e, f, g, h;
                    if (a.options.disabled) return;
                    switch (c.keyCode) {
                        case $.ui.keyCode.HOME:
                        case $.ui.keyCode.END:
                        case $.ui.keyCode.PAGE_UP:
                        case $.ui.keyCode.PAGE_DOWN:
                        case $.ui.keyCode.UP:
                        case $.ui.keyCode.RIGHT:
                        case $.ui.keyCode.DOWN:
                        case $.ui.keyCode.LEFT:
                            c.preventDefault();
                            if (!a._keySliding) {
                                a._keySliding = !0, $(this).addClass("ui-state-active"), e = a._start(c, d);
                                if (e === !1) return
                            }
                    }
                    h = a.options.step, a.options.values && a.options.values.length ? f = g = a.values(d) : f = g = a.value();
                    switch (c.keyCode) {
                        case $.ui.keyCode.HOME:
                            g = a._valueMin();
                            break;
                        case $.ui.keyCode.END:
                            g = a._valueMax();
                            break;
                        case $.ui.keyCode.PAGE_UP:
                            g = a._trimAlignValue(f + (a._valueMax() - a._valueMin()) / b);
                            break;
                        case $.ui.keyCode.PAGE_DOWN:
                            g = a._trimAlignValue(f - (a._valueMax() - a._valueMin()) / b);
                            break;
                        case $.ui.keyCode.UP:
                        case $.ui.keyCode.RIGHT:
                            if (f === a._valueMax()) return;
                            g = a._trimAlignValue(f + h);
                            break;
                        case $.ui.keyCode.DOWN:
                        case $.ui.keyCode.LEFT:
                            if (f === a._valueMin()) return;
                            g = a._trimAlignValue(f - h)
                    }
                    a._slide(c, d, g)
                }).keyup(function(b) {
                    var c = $(this).data("index.ui-slider-handle");
                    a._keySliding && (a._keySliding = !1, a._stop(b, c), a._change(b, c), $(this).removeClass("ui-state-active"))
                }), this._refreshValue(), this._animateOff = !1
            },
            destroy: function() {
                return this.handles.remove(), this.range.remove(), this.element.removeClass("ui-slider ui-slider-horizontal ui-slider-vertical ui-slider-disabled ui-widget ui-widget-content ui-corner-all").removeData("slider").unbind(".slider"), this._mouseDestroy(), this
            },
            _mouseCapture: function(a) {
                var b = this.options,
                    c, d, e, f, g, h, i, j, k;
                return b.disabled ? !1 : (this.elementSize = {
                    width: this.element.outerWidth(),
                    height: this.element.outerHeight()
                }, this.elementOffset = this.element.offset(), c = {
                    x: a.pageX,
                    y: a.pageY
                }, d = this._normValueFromMouse(c), e = this._valueMax() - this._valueMin() + 1, g = this, this.handles.each(function(a) {
                    var b = Math.abs(d - g.values(a));
                    e > b && (e = b, f = $(this), h = a)
                }), b.range === !0 && this.values(1) === b.min && (h += 1, f = $(this.handles[h])), i = this._start(a, h), i === !1 ? !1 : (this._mouseSliding = !0, g._handleIndex = h, f.addClass("ui-state-active").focus(), j = f.offset(), k = !$(a.target).parents().andSelf().is(".ui-slider-handle"), this._clickOffset = k ? {
                    left: 0,
                    top: 0
                } : {
                    left: a.pageX - j.left - f.width() / 2,
                    top: a.pageY - j.top - f.height() / 2 - (parseInt(f.css("borderTopWidth"), 10) || 0) - (parseInt(f.css("borderBottomWidth"), 10) || 0) + (parseInt(f.css("marginTop"), 10) || 0)
                }, this.handles.hasClass("ui-state-hover") || this._slide(a, h, d), this._animateOff = !0, !0))
            },
            _mouseStart: function(a) {
                return !0
            },
            _mouseDrag: function(a) {
                var b = {
                    x: a.pageX,
                    y: a.pageY
                }, c = this._normValueFromMouse(b);
                return this._slide(a, this._handleIndex, c), !1
            },
            _mouseStop: function(a) {
                return this.handles.removeClass("ui-state-active"), this._mouseSliding = !1, this._stop(a, this._handleIndex), this._change(a, this._handleIndex), this._handleIndex = null, this._clickOffset = null, this._animateOff = !1, !1
            },
            _detectOrientation: function() {
                this.orientation = this.options.orientation === "vertical" ? "vertical" : "horizontal"
            },
            _normValueFromMouse: function(a) {
                var b, c, d, e, f;
                return this.orientation === "horizontal" ? (b = this.elementSize.width, c = a.x - this.elementOffset.left - (this._clickOffset ? this._clickOffset.left : 0)) : (b = this.elementSize.height, c = a.y - this.elementOffset.top - (this._clickOffset ? this._clickOffset.top : 0)), d = c / b, d > 1 && (d = 1), d < 0 && (d = 0), this.orientation === "vertical" && (d = 1 - d), e = this._valueMax() - this._valueMin(), f = this._valueMin() + d * e, this._trimAlignValue(f)
            },
            _start: function(a, b) {
                var c = {
                    handle: this.handles[b],
                    value: this.value()
                };
                return this.options.values && this.options.values.length && (c.value = this.values(b), c.values = this.values()), this._trigger("start", a, c)
            },
            _slide: function(a, b, c) {
                var d, e, f;
                this.options.values && this.options.values.length ? (d = this.values(b ? 0 : 1), this.options.values.length === 2 && this.options.range === !0 && (b === 0 && c > d || b === 1 && c < d) && (c = d), c !== this.values(b) && (e = this.values(), e[b] = c, f = this._trigger("slide", a, {
                    handle: this.handles[b],
                    value: c,
                    values: e
                }), d = this.values(b ? 0 : 1), f !== !1 && this.values(b, c, !0))) : c !== this.value() && (f = this._trigger("slide", a, {
                    handle: this.handles[b],
                    value: c
                }), f !== !1 && this.value(c))
            },
            _stop: function(a, b) {
                var c = {
                    handle: this.handles[b],
                    value: this.value()
                };
                this.options.values && this.options.values.length && (c.value = this.values(b), c.values = this.values()), this._trigger("stop", a, c)
            },
            _change: function(a, b) {
                if (!this._keySliding && !this._mouseSliding) {
                    var c = {
                        handle: this.handles[b],
                        value: this.value()
                    };
                    this.options.values && this.options.values.length && (c.value = this.values(b), c.values = this.values()), this._trigger("change", a, c)
                }
            },
            value: function(a) {
                if (arguments.length) {
                    this.options.value = this._trimAlignValue(a), this._refreshValue(), this._change(null, 0);
                    return
                }
                return this._value()
            },
            values: function(a, b) {
                var c, d, e;
                if (arguments.length > 1) {
                    this.options.values[a] = this._trimAlignValue(b), this._refreshValue(), this._change(null, a);
                    return
                }
                if (!arguments.length) return this._values();
                if (!$.isArray(arguments[0])) return this.options.values && this.options.values.length ? this._values(a) : this.value();
                c = this.options.values, d = arguments[0];
                for (e = 0; e < c.length; e += 1) c[e] = this._trimAlignValue(d[e]), this._change(null, e);
                this._refreshValue()
            },
            _setOption: function(a, b) {
                var c, d = 0;
                $.isArray(this.options.values) && (d = this.options.values.length), $.Widget.prototype._setOption.apply(this, arguments);
                switch (a) {
                    case "disabled":
                        b ? (this.handles.filter(".ui-state-focus").blur(), this.handles.removeClass("ui-state-hover"), this.handles.propAttr("disabled", !0), this.element.addClass("ui-disabled")) : (this.handles.propAttr("disabled", !1), this.element.removeClass("ui-disabled"));
                        break;
                    case "orientation":
                        this._detectOrientation(), this.element.removeClass("ui-slider-horizontal ui-slider-vertical").addClass("ui-slider-" + this.orientation), this._refreshValue();
                        break;
                    case "value":
                        this._animateOff = !0, this._refreshValue(), this._change(null, 0), this._animateOff = !1;
                        break;
                    case "values":
                        this._animateOff = !0, this._refreshValue();
                        for (c = 0; c < d; c += 1) this._change(null, c);
                        this._animateOff = !1
                }
            },
            _value: function() {
                var a = this.options.value;
                return a = this._trimAlignValue(a), a
            },
            _values: function(a) {
                var b, c, d;
                if (arguments.length) return b = this.options.values[a], b = this._trimAlignValue(b), b;
                c = this.options.values.slice();
                for (d = 0; d < c.length; d += 1) c[d] = this._trimAlignValue(c[d]);
                return c
            },
            _trimAlignValue: function(a) {
                if (a <= this._valueMin()) return this._valueMin();
                if (a >= this._valueMax()) return this._valueMax();
                var b = this.options.step > 0 ? this.options.step : 1,
                    c = (a - this._valueMin()) % b,
                    d = a - c;
                return Math.abs(c) * 2 >= b && (d += c > 0 ? b : -b), parseFloat(d.toFixed(5))
            },
            _valueMin: function() {
                return this.options.min
            },
            _valueMax: function() {
                return this.options.max
            },
            _refreshValue: function() {
                var a = this.options.range,
                    b = this.options,
                    c = this,
                    d = this._animateOff ? !1 : b.animate,
                    e, f = {}, g, h, i, j;
                this.options.values && this.options.values.length ? this.handles.each(function(a, h) {
                    e = (c.values(a) - c._valueMin()) / (c._valueMax() - c._valueMin()) * 100, f[c.orientation === "horizontal" ? "left" : "bottom"] = e + "%", $(this).stop(1, 1)[d ? "animate" : "css"](f, b.animate), c.options.range === !0 && (c.orientation === "horizontal" ? (a === 0 && c.range.stop(1, 1)[d ? "animate" : "css"]({
                        left: e + "%"
                    }, b.animate), a === 1 && c.range[d ? "animate" : "css"]({
                        width: e - g + "%"
                    }, {
                        queue: !1,
                        duration: b.animate
                    })) : (a === 0 && c.range.stop(1, 1)[d ? "animate" : "css"]({
                        bottom: e + "%"
                    }, b.animate), a === 1 && c.range[d ? "animate" : "css"]({
                        height: e - g + "%"
                    }, {
                        queue: !1,
                        duration: b.animate
                    }))), g = e
                }) : (h = this.value(), i = this._valueMin(), j = this._valueMax(), e = j !== i ? (h - i) / (j - i) * 100 : 0, f[c.orientation === "horizontal" ? "left" : "bottom"] = e + "%", this.handle.stop(1, 1)[d ? "animate" : "css"](f, b.animate), a === "min" && this.orientation === "horizontal" && this.range.stop(1, 1)[d ? "animate" : "css"]({
                    width: e + "%"
                }, b.animate), a === "max" && this.orientation === "horizontal" && this.range[d ? "animate" : "css"]({
                    width: 100 - e + "%"
                }, {
                    queue: !1,
                    duration: b.animate
                }), a === "min" && this.orientation === "vertical" && this.range.stop(1, 1)[d ? "animate" : "css"]({
                    height: e + "%"
                }, b.animate), a === "max" && this.orientation === "vertical" && this.range[d ? "animate" : "css"]({
                    height: 100 - e + "%"
                }, {
                    queue: !1,
                    duration: b.animate
                }))
            }
        }), $.extend($.ui.slider, {
            version: "1.8.22"
        })
    }(jQuery)
});
deferred('$lib/jquery_webcam.js', function() {
    /*! webcam plugin v1.0 (c) 2010 Robert Eisele (robert@xarg.org) http://www.xarg.org/project/jquery-webcam-plugin/ */
    (function($) {
        var a = {
            extern: null,
            append: !0,
            width: 320,
            height: 240,
            mode: "callback",
            swffile: "jscam.swf",
            quality: 85,
            debug: function() {},
            onCapture: function() {},
            onTick: function() {},
            onSave: function() {},
            onCameraStart: function() {},
            onCameraStop: function() {},
            onLoad: function() {},
            onDetect: function() {}
        };
        window.webcam = a, $.fn.webcam = function(b) {
            if (typeof b == "object") for (var c in a) b[c] !== undefined && (a[c] = b[c]);
            var d = '<object id="XwebcamXobjectX" type="application/x-shockwave-flash" data="' + a.swffile + '" width="' + a.width + '" height="' + a.height + '"><param name="movie" value="' + a.swffile + '" /><param name="FlashVars" value="mode=' + a.mode + "&amp;quality=" + a.quality + '" /><param name="allowScriptAccess" value="always" /></object>';
            null !== a.extern ? $(a.extern)[a.append ? "append" : "html"](d) : this[a.append ? "append" : "html"](d), (_register = function(b) {
                var c = document.getElementById("XwebcamXobjectX");
                c.capture !== undefined ? (a.capture = function(a) {
                    try {
                        return c.capture(a)
                    } catch (b) {}
                }, a.save = function(a) {
                    try {
                        return c.save(a)
                    } catch (b) {}
                }, a.onLoad()) : 0 == b ? a.debug("error", "Flash movie not yet registered!") : window.setTimeout(_register, 1e3 * (4 - b), b - 1)
            })(3)
        }
    })(jQuery)
});
define("app/ui/settings/with_cropper", ["module", "require", "exports", "$lib/jquery_ui.profile.js", "$lib/jquery_webcam.js"], function(module, require, exports) {
    function odd(a) {
        return a % 2 != 0
    }
    function Cropper() {
        this.dataFromBase64URL = function(a) {
            return a.slice(a.indexOf(",") + 1)
        }, this.determineCrop = function() {
            var a = this.select("cropImageSelector"),
                b = this.select("cropMaskSelector"),
                c = a.offset(),
                d = b.offset(),
                e = this.attr.originalWidth / a.width(),
                f = d.top - c.top + this.attr.maskPadding,
                g = d.left - c.left + this.attr.maskPadding,
                h = d.left + this.attr.maskPadding > c.left ? d.left + this.attr.maskPadding : c.left,
                i = d.top + this.attr.maskPadding > c.top ? d.top + this.attr.maskPadding : c.top,
                j = d.left + b.width() - this.attr.maskPadding < c.left + a.width() ? d.left + b.width() - this.attr.maskPadding : c.left + a.width(),
                k = d.top + b.height() - this.attr.maskPadding < c.top + a.height() ? d.top + b.height() - this.attr.maskPadding : c.top + a.height();
            return {
                maskWidth: b.width() - 2 * this.attr.maskPadding,
                maskHeight: b.height() - 2 * this.attr.maskPadding,
                imageLeft: Math.round(e * (g >= 0 ? g : 0)),
                imageTop: Math.round(e * (f >= 0 ? f : 0)),
                imageWidth: Math.round(e * (j - h)),
                imageHeight: Math.round(e * (k - i)),
                maskY: f < 0 ? -f : 0,
                maskX: g < 0 ? -g : 0
            }
        }, this.determineImageType = function(a) {
            return a.substr(a.indexOf(","), 4).indexOf(",/9j") == 0 ? "image/jpeg" : "image/png"
        }, this.canvasToDataURL = function(a, b) {
            return b == "image/jpeg" ? a.toDataURL("image/jpeg", .75) : a.toDataURL("image/png")
        }, this.clientsideCrop = function(a) {
            var b = this.select("drawSurfaceSelector"),
                c = this.select("cropImageSelector"),
                d = this.determineImageType(c.attr("src")),
                e = b[0].getContext("2d"),
                f = a.maskHeight,
                g = a.maskWidth,
                h = a.maskX,
                i = a.maskY;
            c.height(this.attr.originalHeight), c.width(this.attr.originalWidth);
            if (a.imageWidth >= this.attr.maximumWidth || a.imageHeight >= this.attr.maximumHeight) f = this.attr.maximumHeight, g = this.attr.maximumWidth, h = Math.round(a.maskX * (this.attr.maximumWidth / a.imageWidth)), i = Math.round(a.maskY * (this.attr.maximumHeight / a.imageHeight));
            return e.canvas.width = g, e.canvas.height = f, e.fillStyle = "white", e.fillRect(0, 0, g, f), e.drawImage(c[0], a.imageLeft, a.imageTop, a.imageWidth, a.imageHeight, h, i, g, f), {
                fileData: this.dataFromBase64URL(this.canvasToDataURL(b[0], d)),
                offsetTop: 0,
                offsetLeft: 0,
                width: e.canvas.width,
                height: e.canvas.height
            }
        }, this.cropDimensions = function() {
            var a = this.select("cropMaskSelector"),
                b = a.offset();
            return {
                top: b.top,
                left: b.left,
                maskWidth: a.width(),
                maskHeight: a.height(),
                cropWidth: a.width() - 2 * this.attr.maskPadding,
                cropHeight: a.height() - 2 * this.attr.maskPadding
            }
        }, this.centerImage = function() {
            var a = this.cropDimensions(),
                b = this.select("cropImageSelector"),
                c = b.width(),
                d = b.height(),
                e = c / d;
            c >= d && a.cropWidth >= a.cropHeight && e >= a.cropWidth / a.cropHeight ? (d = a.cropHeight, c = Math.round(c * (d / this.attr.originalHeight))) : (c = a.cropWidth, d = Math.round(d * (c / this.attr.originalWidth))), b.width(c), b.height(d), b.offset({
                top: a.maskHeight / 2 - d / 2 + a.top,
                left: a.maskWidth / 2 - c / 2 + a.left
            })
        }, this.onDragStart = function(a, b) {
            this.attr.imageStartOffset = this.select("cropImageSelector").offset()
        }, this.onDragHandler = function(a, b) {
            this.select("cropImageSelector").offset({
                top: this.attr.imageStartOffset.top + b.position.top - b.originalPosition.top,
                left: this.attr.imageStartOffset.left + b.position.left - b.originalPosition.left
            })
        }, this.onDragStop = function(a, b) {
            this.select("cropOverlaySelector").offset(this.select("cropMaskSelector").offset())
        }, this.imageLoaded = function(a, b) {
            function h(a) {
                var b = c.offset(),
                    d = Math.round(b.left + c.width() / 2),
                    e = Math.round(b.top + c.height() / 2),
                    h = Math.round(f * (1 + a.value / 100)),
                    i = Math.round(g * (1 + a.value / 100));
                h = odd(h) ? h += 1 : h, i = odd(i) ? i += 1 : i, c.height(h), c.width(i), c.offset({
                    top: Math.round(e - h / 2),
                    left: Math.round(d - i / 2)
                })
            }
            var c = this.select("cropImageSelector"),
                d = this.select("cropOverlaySelector"),
                e = this.select("cropperSliderSelector");
            this.attr.originalHeight = c.height(), this.attr.originalWidth = c.width(), this.centerImage();
            var f = c.height(),
                g = c.width();
            e.slider({
                value: 0,
                max: 100,
                min: 0,
                slide: function(a, b) {
                    h(b)
                }
            }), e.slider("option", "value", 0), d.draggable({
                drag: this.onDragHandler.bind(this),
                stop: this.onDragStop.bind(this),
                start: this.onDragStart.bind(this),
                containment: this.attr.cropContainerSelector
            })
        }, this.after("initialize", function() {
            this.on(this.attr.cropImageSelector, "load", this.imageLoaded)
        })
    }
    require("$lib/jquery_ui.profile.js"), require("$lib/jquery_webcam.js"), module.exports = Cropper
});
define("app/ui/settings/with_webcam", ["module", "require", "exports", "$lib/jquery_ui.profile.js", "$lib/jquery_webcam.js"], function(module, require, exports) {
    function Webcam() {
        this.doJsCam = function() {
            $(this.attr.webcamContainerSelector).webcam({
                width: 320,
                height: 240,
                mode: "callback",
                swffile: "/flash/jscam.swf",
                onLoad: this.jsCamLoad.bind(this),
                onCameraStart: this.jsCamCameraStart.bind(this),
                onCameraStop: this.jsCamCameraStop.bind(this),
                onCapture: this.jsCamCapture.bind(this),
                onSave: this.jsCamSave.bind(this),
                debug: this.jsCamDebug
            })
        }, this.jsCamLoad = function() {
            var a = this.select("webcamCanvasSelector")[0].getContext("2d");
            this.image = a.getImageData(0, 0, 320, 240), this.pos = 0
        }, this.jsCamCameraStart = function() {
            this.select("captureWebcamSelector").attr("disabled", !1)
        }, this.jsCamCameraStop = function() {
            this.select("captureWebcamSelector").attr("disabled", !0)
        }, this.jsCamCapture = function() {
            window.webcam.save()
        }, this.jsCamSave = function(a) {
            var b = this.select("webcamCanvasSelector")[0].getContext("2d"),
                c = a.split(";"),
                d = this.image;
            for (var e = 0; e < 320; e++) {
                var f = parseInt(c[e]);
                d.data[this.pos + 0] = f >> 16 & 255, d.data[this.pos + 1] = f >> 8 & 255, d.data[this.pos + 2] = f & 255, d.data[this.pos + 3] = 255, this.pos += 4
            }
            if (this.pos >= 307200) {
                var g = this.select("webcamCanvasSelector")[0],
                    h = this.select("cropImageSelector")[0];
                b.putImageData(d, 0, 0), h.src = g.toDataURL("image/png"), this.pos = 0, this.trigger("jsCamCapture")
            }
        }, this.jsCamDebug = function(a, b) {}
    }
    require("$lib/jquery_ui.profile.js"), require("$lib/jquery_webcam.js"), module.exports = Webcam
});
define("app/ui/dialogs/profile_image_upload_dialog", ["module", "require", "exports", "core/component", "app/ui/settings/with_cropper", "app/ui/with_dialog", "app/ui/with_position", "app/ui/settings/with_webcam", "app/utils/image", "core/utils", "core/i18n", "core/clock", "$lib/jquery_ui.profile.js", "$lib/jquery_webcam.js"], function(module, require, exports) {
    function profileImageUpload() {
        this.defaultAttrs({
            profileImageCropDivSelector: ".image-upload-crop",
            profileImageWebcamDivSelector: ".image-upload-webcam",
            cancelSelector: ".profile-image-cancel",
            saveSelector: ".profile-image-save",
            cropperSliderSelector: ".cropper-slider",
            cropImageSelector: ".crop-image",
            cropMaskSelector: ".cropper-mask",
            cropOverlaySelector: ".cropper-overlay",
            captureWebcamSelector: ".profile-image-capture-webcam",
            webcamContainerSelector: ".webcam-container",
            webcamCanvasSelector: ".webcam-canvas",
            imageNameSelector: "#choose-photo div.photo-selector input.file-name",
            imageDataSelector: "#choose-photo div.photo-selector input.file-data",
            imageUploadSpinnerSelector: ".image-upload-spinner",
            maskPadding: 40,
            top: 50,
            uploadType: "",
            drawSurfaceSelector: ".drawsurface",
            saveEvent: "uiProfileImageSave",
            successEvent: "dataProfileImageSuccess",
            errorEvent: "dataProfileImageFailure",
            showSuccessMessage: !0,
            maximumWidth: 256,
            maximumHeight: 256,
            fileName: ""
        }), this.showCropper = function(a) {
            this.select("captureWebcamSelector").hide(), this.select("saveSelector").show(), this.attr.fileName = a, this.clearForm(), this.trigger("uiShowingCropper", {
                uploadType: this.getUploadType()
            })
        }, this.setUploadType = function(a) {
            this.select("cropImageSelector").attr("upload-type", a)
        }, this.getUploadType = function() {
            return this.select("cropImageSelector").attr("upload-type")
        }, this.reset = function() {
            this.select("cropImageSelector").attr("src", ""), this.select("cropImageSelector").attr("style", ""), this.select("webcamContainerSelector").empty(), this.select("cancelSelector").show(), this.select("saveSelector").attr("disabled", !1).hide(), this.$node.removeClass("saving"), this.select("profileImageWebcamDivSelector").hide(), this.select("profileImageCropDivSelector").hide(), this.select("captureWebcamSelector").hide()
        }, this.swapVisibility = function(a, b) {
            this.$node.find(a).hide(), this.$node.find(b).show()
        }, this.haveImageSelected = function(a, b) {
            var c = $(this.attr.imageNameSelector).attr("value"),
                d = "data:image/jpeg;base64," + $(this.attr.imageDataSelector).attr("value");
            this.gotImageData(b.uploadType, c, d), this.trigger("uiCloseDropdowns")
        }, this.gotImageData = function(a, b, c) {
            a !== "background" && this.attr.uploadType == a && (this.openDialog(), this.trigger("uiUploadReceived"), this.select("cropImageSelector").attr("src", c), this.select("profileImageCropDivSelector").show(), this.setUploadType("upload"), this.showCropper(b))
        }, this.openDialog = function() {
            this.open(), this.reset()
        }, this.showWebcam = function(a, b) {
            if (this.attr.uploadType != b.uploadType) return;
            this.openDialog(), this.select("profileImageWebcamDivSelector").show(), this.select("captureWebcamSelector").show(), this.doJsCam(), this.trigger("uiShowingWebcam")
        }, this.takePhoto = function() {
            webcam.capture()
        }, this.webcamCaptured = function() {
            this.swapVisibility(this.attr.profileImageWebcamDivSelector, this.attr.profileImageCropDivSelector), this.setUploadType("webcam"), $(this.attr.imageDataSelector).attr("value", this.dataFromBase64URL(this.select("cropImageSelector").attr("src"))), $(this.attr.imageNameSelector).attr("value", "webcam-cap.png"), this.showCropper()
        }, this.save = function(a, b) {
            if (this.$node.hasClass("saving")) return;
            var c = this.determineCrop(),
                b = this.clientsideCrop(c);
            return b.fileName = this.attr.fileName, b.uploadType = this.attr.uploadType, this.trigger("uiImageSave", b), this.enterSavingState(), a.preventDefault(), !1
        }, this.enterSavingState = function() {
            this.select("imageUploadSpinnerSelector").css("height", this.select("profileImageCropDivSelector").height()), this.$node.addClass("saving"), this.select("saveSelector").attr("disabled", !0), this.select("cancelSelector").hide()
        }, this.uploadSuccess = function(a, b) {
            if (b && b.sourceEventData && b.sourceEventData.uploadType != this.attr.uploadType) return;
            if (this.attr.showSuccessMessage) {
                var c = {
                    avatar: _('avatar'),
                    header: _('header'),
                    background: _('background')
                }, d = c[this.attr.uploadType] || this.attr.uploadType;
                this.trigger("uiAlertBanner", {
                    message: _('Your {{uploadType}} was published successfully.', {
                        uploadType: d
                    })
                })
            }
            this.trigger("uiProfileImagePublished", {
                uploadType: this.getUploadType()
            }), this.close()
        }, this.uploadFailed = function(a, b) {
            this.trigger("uiProfileImageDialogFailure", {
                uploadType: this.getUploadType()
            }), this.trigger("uiAlertBanner", {
                message: b.message
            }), this.close()
        }, this.clearForm = function() {
            $(this.attr.imageDataSelector).removeAttr("value"), $(this.attr.imageNameSelector).removeAttr("value")
        }, this.interceptGotProfileImageData = function(a, b) {
            this.gotImageData(b.uploadType, b.name, b.contents)
        }, this.after("initialize", function() {
            this.on(document, "uiCropperWebcam", this.showWebcam), this.on(document, "uiImagePickerFileReady", this.haveImageSelected), this.on("jsCamCapture", this.webcamCaptured), this.on(this.select("captureWebcamSelector"), "click", this.takePhoto), this.on(this.select("saveSelector"), "click", this.save), this.on(document, "dataImageEnqueued", this.close), this.on(document, "uiImageUploadSuccess", this.uploadSuccess), this.on(document, "uiImageUploadFailure dataImageFailedToEnqueue", this.uploadFailed), this.on(document, "uiGotProfileImageData", this.interceptGotProfileImageData), this.on(this.attr.cancelSelector, "click", function(a, b) {
                this.close()
            }), this.after("close", function() {
                this.clearForm(), this.$node.hide(), this.reset(), this.trigger("uiProfileImageDialogClose")
            })
        })
    }
    var defineComponent = require("core/component"),
        withCropper = require("app/ui/settings/with_cropper"),
        withDialog = require("app/ui/with_dialog"),
        withPosition = require("app/ui/with_position"),
        withWebcam = require("app/ui/settings/with_webcam"),
        image = require("app/utils/image"),
        utils = require("core/utils"),
        _ = require("core/i18n"),
        clock = require("core/clock");
    require("$lib/jquery_ui.profile.js"), require("$lib/jquery_webcam.js"), module.exports = defineComponent(profileImageUpload, withCropper, withDialog, withPosition, withWebcam)
});
define("app/ui/droppable_image", ["module", "require", "exports", "core/component", "app/ui/with_drop_events", "app/utils/image"], function(module, require, exports) {
    function droppableImage() {
        this.defaultAttrs({
            uploadType: ""
        }), this.triggerGotProfileImageData = function(a, b) {
            this.trigger("uiGotProfileImageData", {
                name: a,
                contents: b,
                uploadType: this.attr.uploadType
            })
        }, this.getDroppedImageData = function(a, b) {
            if (!this.editing) return;
            a.stopImmediatePropagation();
            var c = b.file;
            image.getFileData(c.name, c, this.triggerGotProfileImageData.bind(this))
        }, this.allowDrop = function(a) {
            this.editing = a.type === "uiEditProfileStart"
        }, this.after("initialize", function() {
            this.editing = !1, this.on(document, "uiEditProfileStart uiEditProfileEnd", this.allowDrop), this.on("uiDrop", this.getDroppedImageData)
        })
    }
    var defineComponent = require("core/component"),
        withDropEvents = require("app/ui/with_drop_events"),
        image = require("app/utils/image");
    module.exports = defineComponent(droppableImage, withDropEvents)
});
define("app/ui/profile_image_monitor", ["module", "require", "exports", "core/component", "app/utils/cookie", "core/clock"], function(module, require, exports) {
    function profileImageMonitor() {
        this.defaultAttrs({
            isProcessingCookie: "image_processing_complete_key",
            pollInterval: 2e3,
            uploadType: "avatar",
            spinnerUrl: undefined,
            spinnerSelector: ".preview-spinner",
            thumbnailSelector: "#avatar_preview",
            miniAvatarThumbnailSelector: ".mini-profile .avatar",
            deleteButtonSelector: "#delete-image",
            deleteFormSelector: "#profile_image_delete_form"
        }), this.startPollingUploadStatus = function(a, b) {
            if (this.ignoreEvent(a, b)) return;
            this.stopPollingUploadStatus(), this.uploadCheckTimer = clock.setIntervalEvent("uiCheckImageUploadStatus", this.attr.pollInterval, {
                uploadType: this.attr.uploadType,
                key: cookie(this.attr.isProcessingCookie)
            }), this.setThumbsLoading()
        }, this.stopPollingUploadStatus = function() {
            this.uploadCheckTimer && clock.clearInterval(this.uploadCheckTimer)
        }, this.setThumbsLoading = function(a, b) {
            if (this.ignoreUIEvent(a, b)) return;
            this.updateThumbs(this.attr.spinnerUrl)
        }, this.updateThumbs = function(a) {
            this.attr.uploadType == "avatar" ? ($(this.attr.thumbnailSelector).attr("src", a), $(this.attr.miniAvatarThumbnailSelector).attr("src", a)) : this.attr.uploadType == "header" && $(this.attr.thumbnailSelector).css("background-image", a ? "url(" + a + ")" : "none")
        }, this.checkUploadStatus = function(a, b) {
            if ($("html").hasClass("debug") || b.status == "processing" || this.ignoreEvent(a, b)) return;
            this.handleUploadComplete(b.status), b.status && this.trigger("uiImageUploadSuccess", b)
        }, this.handleUploadComplete = function(a) {
            this.stopPollingUploadStatus(), cookie(this.attr.isProcessingCookie, null, {
                path: "/"
            }), this.updateThumbs(a)
        }, this.handleImageDelete = function(a, b) {
            if (this.ignoreEvent(a, b)) return;
            this.handleUploadComplete(b.status)
        }, this.handleFailedUpload = function(a, b) {
            if (this.ignoreEvent(a, b)) return;
            this.stopPollingUploadStatus(), this.restoreInitialThumbnail(), this.trigger("uiImageUploadFailure", b || {})
        }, this.deleteProfileImage = function(a, b) {
            return a.preventDefault(), $(this.attr.deleteFormSelector).submit(), !1
        }, this.saveInitialThumbnail = function() {
            this.attr.uploadType == "avatar" ? this.initialThumbnail = $(this.attr.thumbnailSelector).attr("src") : this.attr.uploadType == "header" && (this.initialThumbnail = $(this.attr.thumbnailSelector).css("background-image"))
        }, this.restoreInitialThumbnail = function() {
            this.attr.uploadType == "avatar" ? ($(this.attr.thumbnailSelector).attr("src", this.initialThumbnail), $(this.attr.miniAvatarThumbnailSelector).attr("src", this.initialThumbnail)) : this.attr.uploadType == "header" && $(this.attr.thumbnailSelector).css("background-image", this.initialThumbnail)
        }, this.ignoreEvent = function(a, b) {
            return b && b.sourceEventData && b.sourceEventData.uploadType != this.attr.uploadType
        }, this.ignoreUIEvent = function(a, b) {
            return b && b.uploadType != this.attr.uploadType
        }, this.after("initialize", function() {
            this.attr.spinnerUrl = this.select("spinnerSelector").attr("src"), cookie(this.attr.isProcessingCookie) ? this.startPollingUploadStatus() : this.saveInitialThumbnail(), this.on(document, "dataImageEnqueued", this.startPollingUploadStatus), this.on(document, "dataHasImageUploadStatus", this.checkUploadStatus), this.on(document, "dataDeleteImageSuccess", this.handleImageDelete), this.on(document, "dataFailedToGetImageUploadStatus", this.handleFailedUpload), this.on(document, "uiDeleteImage", this.setThumbsLoading), this.on(this.attr.deleteButtonSelector, "click", this.deleteProfileImage)
        })
    }
    var defineComponent = require("core/component"),
        cookie = require("app/utils/cookie"),
        clock = require("core/clock");
    module.exports = defineComponent(profileImageMonitor)
});
define("app/data/profile_header_scribe", ["module", "require", "exports", "core/component", "app/data/with_scribe"], function(module, require, exports) {
    function profileHeaderScribe() {
        this.scribeProfileHeaderSelection = function(a, b) {
            this.scribe({
                action: "click",
                element: "header_image",
                component: "form"
            }, b)
        }, this.after("initialize", function() {
            this.on("uiProfileHeaderImageSelect", this.scribeProfileHeaderSelection)
        })
    }
    var defineComponent = require("core/component"),
        withScribe = require("app/data/with_scribe");
    module.exports = defineComponent(profileHeaderScribe, withScribe)
});
define("app/data/settings/profile_image_upload_scribe", ["module", "require", "exports", "core/component", "core/utils", "app/data/with_scribe"], function(module, require, exports) {
    function profileImageUploadScribe() {
        this.defaultAttrs({
            scribeContext: {
                component: "profile_image_upload"
            }
        }), this.profileScribeData = function(a) {
            return utils.merge(this.attr.scribeContext, a)
        }, this.scribeEvent = function(a) {
            this.scribe(this.profileScribeData(a))
        }, this.after("initialize", function() {
            this.scribeOnEvent("uiCropperFilePicker", this.profileScribeData({
                element: "upload",
                action: "impression"
            })), this.scribeOnEvent("uiUploadReceived", this.profileScribeData({
                element: "upload",
                action: "complete"
            })), this.scribeOnEvent("uiShowingWebcam", this.profileScribeData({
                element: "webcam",
                action: "impression"
            })), this.scribeOnEvent("jsCamCapture", this.profileScribeData({
                element: "webcam",
                action: "complete"
            })), this.on("uiImageSave", function(a, b) {
                this.scribeEvent({
                    element: "crop_" + b.uploadType,
                    action: "complete"
                })
            }), this.on("uiShowingCropper", function(a, b) {
                this.scribeEvent({
                    element: "crop_" + b.uploadType,
                    action: "impression"
                })
            }), this.on("uiProfileImagePublished", function(a, b) {
                this.scribeEvent({
                    element: "save_" + b.uploadType,
                    action: "complete"
                })
            }), this.on("uiProfileImageDialogFailure", function(a, b) {
                this.scribeEvent({
                    element: "save_" + b.uploadType,
                    action: "failure"
                })
            }), this.scribeOnEvent("uiProfileImageDialogClose", this.profileScribeData({
                action: "close"
            }))
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        withScribe = require("app/data/with_scribe"),
        ProfileImageUploadScribe = defineComponent(profileImageUploadScribe, withScribe);
    module.exports = ProfileImageUploadScribe
});
define("app/ui/settings/change_photo", ["module", "require", "exports", "core/component", "app/ui/with_dropdown", "app/data/with_scribe", "app/utils/image", "core/utils", "core/i18n"], function(module, require, exports) {
    function changePhoto() {
        this.defaultAttrs({
            uploadType: "avatar",
            swfSelector: "div.webcam-detect.swf-container",
            toggler: "button.choose-photo-button",
            chooseExistingSelector: "#photo-choose-existing",
            chooseWebcamSelector: "#photo-choose-webcam",
            deleteImageSelector: "#photo-delete-image",
            itemSelector: "li.dropdown-link",
            caretSelector: ".caret",
            photoSelector: "div.photo-selector",
            showDeleteSuccessMessage: !0
        }), this.webcamDetectorSwfPath = "/flash/WebcamDetector.swf", this.scribeContext = {
            component: "profile_image_upload"
        }, this.scribeEvent = function(a) {
            this.scribe(utils.merge(this.scribeContext, a))
        }, this.isUsingFlashUploader = function() {
            return image.hasFlash() && !image.hasFileReader()
        }, this.isFirefox36 = function() {
            var a = $.browser;
            return a.mozilla && a.version.slice(0, 3) == "1.9"
        }, this.needsMenuHeldOpen = function() {
            return this.isUsingFlashUploader() || this.isFirefox36()
        }, this.openWebCamDialog = function(a) {
            a.preventDefault(), this.needsMenuHeldOpen() && (this.ignoreCloseEvent = !1), this.trigger("uiCropperWebcam", {
                uploadType: this.attr.uploadType
            })
        }, this.webcamDetected = function() {
            var a = this.select("chooseWebcamSelector");
            this.updateDropdownItemVisibility(a, !a.hasClass("no-webcam"))
        }, this.dropdownOpened = function() {
            this.scribeEvent({
                action: "open"
            }), this.needsMenuHeldOpen() && (this.ignoreCloseEvent = !0)
        }, this.setupWebcamDetection = function() {
            var a = this.select("swfSelector");
            image.hasFlash() && (window.webcam && (window.webcam.onDetect = this.webcamDetected.bind(this)), a.css("width", "0"), a.css("height", "0"), a.css("overflow", "hidden"), a.flash({
                swf: this.webcamDetectorSwfPath,
                height: 1,
                width: 1,
                wmode: "transparent",
                AllowScriptAccess: "sameDomain"
            }))
        }, this.deleteImage = function() {
            this.attr.uploadType !== "background" ? (this.needsMenuHeldOpen() && (this.ignoreCloseEvent = !1), this.trigger("uiDeleteImage", {
                uploadType: this.attr.uploadType
            })) : this.hideFileName(), this.hideDeleteLink()
        }, this.handleDeleteImageSuccess = function(a, b) {
            b.message && this.attr.showDeleteSuccessMessage && this.trigger("uiAlertBanner", b)
        }, this.handleDeleteImageFailure = function(a, b) {
            if (b.sourceEventData.uploadType != this.attr.uploadType) return;
            b.message = b.message || _('Sorry! Something went wrong deleting your {{uploadType}}. Please try again.', this.attr), this.trigger("uiAlertBanner", b), this.showDeleteLink()
        }, this.showDeleteLinkForTargetedButton = function(a, b) {
            b.uploadType == this.attr.uploadType && b.uploadType == "background" && this.showDeleteLink()
        }, this.showDeleteLink = function() {
            this.updateDropdownItemVisibility(this.select("deleteImageSelector"), !0)
        }, this.hideDeleteLink = function() {
            this.updateDropdownItemVisibility(this.select("deleteImageSelector"), !1)
        }, this.showFileName = function(a, b) {
            this.$node.siblings(".display-file-requirement").hide(), this.$node.siblings(".display-file-name").text(b.fileName).show()
        }, this.hideFileName = function() {
            this.$node.siblings(".display-file-requirement").show(), this.$node.siblings(".display-file-name").hide()
        }, this.updateDropdownItemVisibility = function(a, b) {
            b ? a.show() : a.hide(), this.updateMenuHierarchy()
        }, this.upliftFilePicker = function() {
            var a = this.select("photoSelector");
            this.select("toggler").hide(), a.find("button").attr("disabled", !1), a.appendTo(this.$node)
        }, this.moveFilePickerBackIntoMenu = function() {
            var a = this.select("photoSelector");
            a.appendTo(this.select("chooseExistingSelector")), this.select("toggler").show()
        }, this.updateMenuHierarchy = function() {
            this.availableDropdownItems().length == 1 ? this.upliftFilePicker() : this.moveFilePickerBackIntoMenu()
        }, this.availableDropdownItems = function() {
            return this.select("itemSelector").filter(function() {
                return $(this).css("display") != "none"
            })
        }, this.selectProfileHeader = function() {
            this.trigger("uiProfileHeaderImageSelect")
        }, this.after("initialize", function() {
            this.setupWebcamDetection(), this.on(document, "click", this.close), this.on(document, "uiNavigate", this.close), this.on(document, "uiImageUploadSuccess", this.showDeleteLink), this.on(document, "uiImagePickerFileReady", this.showDeleteLinkForTargetedButton), this.on(document, "uiFileNameReady", this.showFileName), this.on(document, "dataImageEnqueued", this.hideDeleteLink), this.on(document, "dataDeleteImageSuccess", this.handleDeleteImageSuccess), this.on(document, "dataDeleteImageFailure", this.handleDeleteImageFailure), this.on("uiDropdownOpened", this.dropdownOpened), this.on("click", {
                chooseWebcamSelector: this.openWebCamDialog,
                chooseExistingSelector: this.selectProfileHeader,
                deleteImageSelector: this.deleteImage
            }), this.around("toggleDisplay", function(a, b) {
                var c = this.availableDropdownItems();
                c.length == 1 && !this.$node.hasClass("open") && !this.isItemClick(b) ? c.click() : a(b)
            }), this.updateMenuHierarchy()
        })
    }
    var defineComponent = require("core/component"),
        withDropdown = require("app/ui/with_dropdown"),
        withScribe = require("app/data/with_scribe"),
        image = require("app/utils/image"),
        utils = require("core/utils"),
        _ = require("core/i18n");
    module.exports = defineComponent(changePhoto, withDropdown, withScribe)
});
define("app/ui/image_uploader", ["module", "require", "exports", "core/component", "app/utils/image", "app/utils/image_resize", "app/utils/image_thumbnail", "app/ui/with_image_selection", "app/data/with_scribe", "core/utils", "core/i18n"], function(module, require, exports) {
    function imageUploader() {
        this.defaults = {
            swfHeight: 30,
            swfWidth: 274,
            uploadType: "",
            fileNameTextSelector: ".photo-file-name"
        }, this.updateFileNameText = function(a, b) {
            var c = this.truncate(b.fileName, 18);
            this.select("fileNameSelector").val(b.fileName), this.select("fileNameTextSelector").text(c), this.trigger("uiFileNameReady", {
                fileName: c
            })
        }, this.addFileError = function(a) {
            a == "tooLarge" ? this.trigger("uiAlertBanner", {
                message: this.attr.fileTooBigMessage
            }) : (a == "notImage" || a == "ioError") && this.trigger("uiAlertBanner", {
                message: _('You did not select an image.')
            }), this.scribe({
                component: "profile_image",
                element: "upload",
                action: "failure"
            }), typeof this.attr.onError == "function" && this.attr.onError(), this.reset()
        }, this.gotImageData = function(a, b) {
            this.gotResizedImageData(a, b)
        }, this.truncate = function(a, b) {
            if (a.length <= b) return a;
            var c = Math.ceil(b / 2),
                d = Math.floor(b / 2),
                e = a.substr(0, c),
                f = a.substr(a.length - d, d);
            return e + "â€¦" + f
        }, this.loadSwf = function(a, b) {
            image.loadPhotoSelectorSwf(this.select("swfSelector"), a, b, this.attr.swfHeight, this.attr.swfWidth, this.attr.maxSizeInBytes)
        }, this.initializeButton = function() {
            this.select("buttonSelector").attr("disabled", !1)
        }, this.resetUploader = function() {
            this.select("fileNameSelector").val(""), this.select("fileNameTextSelector").text(_('No file selected'))
        }, this.after("initialize", function() {
            this.maxSizeInBytes = this.attr.maxSizeInBytes, this.initializeButton(), this.on(this.$node, "uiTweetBoxShowPreview", this.updateFileNameText), this.on("uiResetUploader", this.resetUploader)
        })
    }
    var defineComponent = require("core/component"),
        image = require("app/utils/image"),
        imageResize = require("app/utils/image_resize"),
        imageThumbnail = require("app/utils/image_thumbnail"),
        withImageSelection = require("app/ui/with_image_selection"),
        withScribe = require("app/data/with_scribe"),
        utils = require("core/utils"),
        _ = require("core/i18n"),
        ImageUploader = defineComponent(imageUploader, withImageSelection, withScribe);
    module.exports = ImageUploader
});
define("app/data/settings", ["module", "require", "exports", "core/component", "app/data/with_auth_token", "app/data/with_data", "core/i18n"], function(module, require, exports) {
    var defineComponent = require('core/component'),
        withAuthToken = require('app/data/with_auth_token'),
        withData = require('app/data/with_data'),
        _ = require('core/i18n');
    var SettingsData = defineComponent(settingsData, withData, withAuthToken);

    function settingsData() {
        // TODO: dedupe these methods
        this.defaultAttrs({
            ajaxTimeout: 6000,
            noShowError: true
        });
        this.verifyUsername = function(event, data) {
            this.get({
                url: '/users/username_available',
                eventData: data,
                data: data,
                success: 'dataUsernameResult',
                error: 'dataUsernameError'
            });
        };
        this.verifyEmail = function(event, data) {
            this.get({
                url: '/users/email_available',
                eventData: data,
                data: data,
                success: 'dataEmailResult',
                error: 'dataEmailError'
            });
        };
        this.cancelPendingEmail = function(event, data) {
            var success = function(json) {
                this.trigger('dataCancelEmailSuccess', json);
            };
            var error = function(request) {
                this.trigger('dataCancelEmailFailure', request);
            };
            this.post({
                url: data.url,
                data: this.addAuthToken(),
                success: success.bind(this),
                error: error.bind(this)
            });
        };
        this.resendPendingEmail = function(event, data) {
            var success = function(json) {
                this.trigger('dataResendEmailSuccess', json);
            };
            var error = function(request) {
                this.trigger('dataResendEmailFailure', request);
            };
            this.post({
                url: data.url,
                data: this.addAuthToken(),
                success: success.bind(this),
                error: error.bind(this)
            });
        };
        this.resendPassword = function(event, data) {
            this.post({
                url: data.url,
                data: this.addAuthToken(),
                dataType: 'text',
                success: function() {
                    this.trigger('dataForgotPasswordSuccess', {});
                }.bind(this)
            });
        };
        this.deleteGeoData = function(event) {
            var error = function(request) {
                this.trigger('dataGeoDeletionError', {});
            };
            this.post({
                url: '/account/delete_location_data',
                dataType: 'text',
                data: this.addAuthToken(),
                error: error.bind(this)
            });
        };
        //enhanced profile events
        this.publishBanner = function(event, data) {
            this.post({
                url: '/settings/enhanced_profile/publish_banner',
                eventData: data,
                data: {},
                timeout: this.attr.ajaxTimeout,
                success: 'dataPublishBannerSuccess',
                error: 'dataPublishBannerFailure'
            });
        };
        this.deletePreviewBanner = function(event, data) {
            this.post({
                url: '/settings/enhanced_profile/delete_banner',
                eventData: data,
                data: {
                    'banner_type': 'preview'
                },
                timeout: this.attr.ajaxTimeout,
                success: 'dataDeletePreviewSuccess',
                error: 'dataDeletePreviewFailure'
            });
        };
        this.deleteBanner = function(event, data) {
            this.post({
                url: '/settings/enhanced_profile/delete_banner',
                eventData: data,
                data: {
                    'banner_type': 'live'
                },
                timeout: this.attr.ajaxTimeout,
                success: 'dataDeleteBannerSuccess',
                error: 'dataDeleteBannerFailure'
            });
        };
        this.revokeAuthority = function(event, data) {
            this.post({
                url: '/oauth/revoke',
                eventData: data,
                data: data,
                success: 'dataOAuthRevokeResultSuccess',
                error: 'dataOAuthRevokeResultFailure'
            });
        };
        // duckface events
        this.uploadImage = function(event, data) {
            var uploadTypeToUrl = {
                header: '/settings/profile/upload_profile_header',
                avatar: '/settings/profile/profile_image_update'
            };
            data.page_context = this.attr.pageName;
            this.post({
                url: uploadTypeToUrl[data.uploadType],
                eventData: data,
                data: data,
                success: 'dataImageEnqueued',
                error: 'dataImageFailedToEnqueue'
            });
        };
        this.checkImageUploadStatus = function(event, data) {
            var uploadTypeToUrl = {
                header: '/settings/profile/check_header_processing_complete',
                avatar: '/settings/profile/swift_check_processing_complete'
            };
            this.get({
                url: uploadTypeToUrl[data.uploadType],
                eventData: data,
                data: data,
                headers: {
                    'X-Retry-After': true
                },
                success: 'dataHasImageUploadStatus',
                error: 'dataFailedToGetImageUploadStatus'
            });
        };
        this.deleteImage = function(event, data) {
            var uploadTypeToUrl = {
                header: '/settings/profile/destroy_profile_header',
                avatar: '/settings/profile'
            };
            this.destroy({
                url: uploadTypeToUrl[data.uploadType],
                eventData: data,
                data: data,
                success: 'dataDeleteImageSuccess',
                error: 'dataDeleteImageFailure'
            });
        };
        // method also exists in data/email_banner.js
        this.resendConfirmationEmail = function(event, data) {
            this.post({
                url: '/account/resend_confirmation_email',
                eventData: data,
                data: data,
                success: 'dataResendConfirmationEmailSuccess',
                error: 'dataResendConfirmationEmailError'
            });
        };
        // Call to export tweets
        this.tweetExport = function(event, data) {
            this.post({
                url: '/account/request_tweet_export',
                eventData: data,
                data: data,
                success: 'dataTweetExportSuccess',
                error: 'dataTweetExportError'
            });
        };
        // Call to resend download email
        this.tweetExportResend = function(event, data) {
            this.post({
                url: '/account/request_tweet_export_resend',
                eventData: data,
                data: data,
                success: 'dataTweetExportResendSuccess',
                error: 'dataTweetExportResendError'
            });
        };
        // Call to increase rate limiter on user
        this.tweetExportIncrRateLimiter = function(event, data) {
            this.post({
                url: '/account/request_tweet_export_download',
                eventData: data,
                data: data,
                success: 'dataTweetExportDownloadSuccess',
                error: 'dataTweetExportDownloadError'
            });
        };
        this.after('initialize', function() {
            this.on('uiPublishBanner', this.publishBanner);
            this.on('uiDeletePreview', this.deletePreviewBanner);
            this.on('uiDeleteBanner', this.deleteBanner);
            this.on('uiUsernameChange', this.verifyUsername);
            this.on('uiEmailChange', this.verifyEmail);
            this.on('uiCancelPendingEmail', this.cancelPendingEmail);
            this.on('uiResendPendingEmail', this.resendPendingEmail);
            this.on('uiForgotPassword', this.resendPassword);
            this.on('uiDeleteGeoData', this.deleteGeoData);
            this.on('uiRevokeClick', this.revokeAuthority);
            // duckface endpoint
            this.on('uiImageSave', this.uploadImage);
            this.on('uiDeleteImage', this.deleteImage);
            this.on('uiCheckImageUploadStatus', this.checkImageUploadStatus);
            // Grailbird (tweet / DM export)
            this.on('uiTweetExportButtonClicked', this.tweetExport);
            this.on('uiTweetExportResendButtonClicked', this.tweetExportResend);
            this.on('uiTweetExportConfirmEmail', this.resendConfirmationEmail);
            this.on('uiTweetExportIncrRateLimiter', this.tweetExportIncrRateLimiter);
            // signup uses these:
            this.on('dataValidateUsername', this.verifyUsername);
            this.on('dataValidateEmail', this.verifyEmail);
        });
    }
    module.exports = SettingsData;
});
define("app/boot/inline_edit", ["module", "require", "exports", "app/ui/inline_edit", "app/data/async_profile", "app/ui/dialogs/profile_image_upload_dialog", "app/ui/droppable_image", "app/ui/profile_image_monitor", "app/data/profile_header_scribe", "app/data/settings/profile_image_upload_scribe", "app/ui/settings/change_photo", "app/ui/image_uploader", "app/data/settings", "core/i18n", "core/utils"], function(module, require, exports) {
    var InlineEdit = require("app/ui/inline_edit"),
        AsyncProfileData = require("app/data/async_profile"),
        ProfileImageUpload = require("app/ui/dialogs/profile_image_upload_dialog"),
        DroppableImage = require("app/ui/droppable_image"),
        ProfileImageMonitor = require("app/ui/profile_image_monitor"),
        ProfileHeaderScribe = require("app/data/profile_header_scribe"),
        ProfileImageUploadScribe = require("app/data/settings/profile_image_upload_scribe"),
        ChangePhoto = require("app/ui/settings/change_photo"),
        ImageUploader = require("app/ui/image_uploader"),
        SettingsData = require("app/data/settings"),
        _ = require("core/i18n"),
        utils = require("core/utils");
    module.exports = function(b) {
        SettingsData.attachTo(document, b), AsyncProfileData.attachTo(document, b), InlineEdit.attachTo(".profile-card .editable-group"), DroppableImage.attachTo(".profile-card .profile-picture", {
            uploadType: "avatar"
        }), DroppableImage.attachTo(".profile-card .profile-header-inner", {
            uploadType: "header"
        }), ImageUploader.attachTo(".avatar-settings .uploader-image .photo-selector", {
            maxSizeInBytes: 10485760,
            fileTooBigMessage: _('Please select a profile image that is less than 10 MB.'),
            uploadType: "avatar"
        }), ProfileImageUpload.attachTo("#profile_image_upload_dialog", {
            uploadType: "avatar"
        }), ProfileImageUpload.attachTo("#header_image_upload_dialog", {
            uploadType: "header",
            maskPadding: 0,
            top: 0,
            left: 0,
            maximumWidth: 1252,
            maximumHeight: 626,
            imageNameSelector: "#choose-header div.photo-selector input.file-name",
            imageDataSelector: "#choose-header div.photo-selector input.file-data"
        }), ChangePhoto.attachTo("#choose-header", {
            uploadType: "header",
            toggler: "#profile_header_upload",
            chooseExistingSelector: "#header-choose-existing",
            chooseWebcamSelector: "#header-choose-webcam",
            deleteImageSelector: "#header-delete-image"
        }), ProfileHeaderScribe.attachTo(document), ProfileImageUploadScribe.attachTo(document), ProfileImageMonitor.attachTo(".uploader-header", {
            uploadType: "header",
            isProcessingCookie: "header_processing_complete_key",
            thumbnailSelector: "#header_image_preview",
            deleteButtonSelector: "#remove_header",
            deleteFormSelector: "#profile_banner_delete_form",
            eventData: {
                scribeContext: {
                    component: "form"
                }
            }
        }), ImageUploader.attachTo(".header-settings .uploader-image .photo-selector", {
            fileNameString: "user[profile_header_image_name]",
            fileDataString: "user[profile_header_image]",
            fileInputString: "user[profile_header_image]",
            uploadType: "header",
            maxSizeInBytes: 1024e4,
            fileTooBigMessage: _('Please select an image that is less than 10MB.'),
            onError: function() {
                window.scrollTo(0, 0)
            }
        })
    }
});
define("app/ui/with_editable_header", ["module", "require", "exports", "core/compose", "core/i18n", "core/clock", "app/ui/with_scrollbar_width"], function(module, require, exports) {
    function withEditableHeader() {
        compose.mixin(this, [withScrollbarWidth]), this.defaultAttrs({
            editProfileButtonSelector: ".inline-edit-profile-btn",
            cancelProfileButtonSelector: ".cancel-profile-btn",
            saveProfileButtonSelector: ".save-profile-btn",
            saveProfileFooterSelector: ".save-profile-footer",
            editableFieldSelector: ".editable-field",
            profileFieldSelector: ".profile-field",
            bioProfileFieldSelector: ".bio.profile-field",
            urlProfileFieldSelector: ".url .profile-field",
            dividerSelector: ".location-and-url .divider",
            locationSelector: ".location",
            urlSelector: ".url .profile-field",
            anchorSelector: "a",
            headerImageUploadDialogSelector: "#header_image_upload_dialog",
            dontTabTo: ".translator-badge, .verified-badge",
            updateErrorMessage: _('There was an error updating your profile.')
        }), this.editProfile = function(a, b) {
            a.preventDefault(), this.trigger("uiEditProfileStart")
        }, this.saveProfile = function(a, b) {
            a.preventDefault(), this.trigger("uiEditProfileSaveFields"), this.trigger("uiEditProfileSave")
        }, this.cancelProfileEditing = function(a, b) {
            a.preventDefault(), this.trigger("uiEditProfileCancel"), this.trigger("uiEditProfileEnd")
        }, this.isEditing = function() {
            return this.$body.hasClass("profile-editing")
        }, this.editModeOn = function() {
            window.scrollTo(0, 0), this.calculateScrollbarWidth(), this.$body.addClass("profile-editing")
        }, this.editModeOff = function() {
            this.$body.removeClass("profile-editing")
        }, this.fieldEditingModeOn = function() {
            this.$body.addClass("profile-field-editing")
        }, this.fieldEditingModeOff = function() {
            this.$body.removeClass("profile-field-editing"), this.checkDivider()
        }, this.editHeaderModeOn = function() {
            this.trigger("uiEditProfileHeaderStart"), this.$body.addClass("profile-header-editing")
        }, this.editHeaderModeOff = function() {
            this.trigger("uiEditProfileHeaderEnd"), this.$body.removeClass("profile-header-editing")
        }, this.checkDivider = function() {
            var a = this.select("dividerSelector");
            $.trim(this.select("locationSelector").text()) && $.trim(this.select("urlSelector").text()) ? a.show() : a.hide()
        }, this.showDivider = function() {
            this.select("dividerSelector").show()
        }, this.catchAnchorClicks = function(a) {
            this.isEditing() && a.preventDefault()
        }, this.disabledTabbing = function() {
            this.select("dontTabTo").attr("tabindex", "-1")
        }, this.enableTabbing = function() {
            this.select("dontTabTo").removeAttr("tabindex")
        }, this.addCardToHeaderUpload = function() {
            var a = this.$node.clone();
            a.find(".profile-editing-dialogs, input, label, textarea, .controls").remove(), a.find("profile-header-inner").css("background-image", "none");
            var b = this.select("headerImageUploadDialogSelector");
            b.find(".profile-card").remove(), b.find(".cropper-mask").prepend(a)
        }, this.updateImage = function(a, b) {
            var c = "data:image/jpeg;base64," + b.fileData;
            b.uploadType === "header" ? this.select("profileHeaderInnerSelector").eq(0).css("background-image", 'url("' + c + '")') : b.uploadType === "avatar" && this.select("avatarSelector").eq(0).attr("src", c)
        }, this.saving = function() {
            this.select("saveProfileFooterSelector").addClass("saving")
        }, this.handleError = function(a, b) {
            this.doneSaving(), this.fieldEditingModeOn(), this.trigger("uiShowError", {
                message: b.message || this.attr.updateErrorMessage
            })
        }, this.savingError = function(a, b) {
            clock.setTimeoutEvent("uiHandleSaveError", 1e3, {
                message: b.message
            })
        }, this.doneSaving = function() {
            this.select("saveProfileFooterSelector").removeClass("saving")
        }, this.finishedProcessing = function(a, b) {
            b && b.linkified_description && this.select("bioProfileFieldSelector").html(b.linkified_description), b && b.user_url && this.select("urlProfileFieldSelector").html(b.user_url), this.trigger("uiEditProfileEnd")
        }, this.after("initialize", function() {
            this.$body = $("body"), this.on("click", {
                editProfileButtonSelector: this.editProfile,
                cancelProfileButtonSelector: this.cancelProfileEditing,
                saveProfileButtonSelector: this.saveProfile,
                anchorSelector: this.catchAnchorClicks
            }), this.on("uiDialogOpened", {
                headerImageUploadDialogSelector: this.editHeaderModeOn
            }), this.on("uiDialogClosed", {
                headerImageUploadDialogSelector: this.editHeaderModeOff
            }), this.on("uiEditProfileHeaderStart", this.addCardToHeaderUpload), this.on("uiEditProfileStart", this.editModeOn), this.on("uiEditProfileEnd", this.editModeOff), this.on("uiEditProfileStart", this.showDivider), this.on("uiEditProfileStart", this.fieldEditingModeOn), this.on("uiEditProfileSave", this.fieldEditingModeOff), this.on("uiEditProfileEnd", this.fieldEditingModeOff), this.on("uiEditProfileHeaderStart", this.fieldEditingModeOff), this.on("uiEditProfileHeaderEnd", this.fieldEditingModeOn), this.on("uiEditProfileStart", this.disabledTabbing), this.on("uiEditProfileEnd", this.enableTabbing), this.on(document, "dataInlineEditSaveStarted", this.saving), this.on(document, "dataInlineEditSaveSuccess", this.doneSaving), this.on(document, "dataInlineEditSaveError", this.savingError), this.on(document, "uiHandleSaveError", this.handleError), this.on(document, "dataInlineEditSaveSuccess", this.finishedProcessing), this.on(document, "uiImageSave", this.updateImage)
        })
    }
    var compose = require("core/compose"),
        _ = require("core/i18n"),
        clock = require("core/clock"),
        withScrollbarWidth = require("app/ui/with_scrollbar_width");
    module.exports = withEditableHeader
});
define("app/ui/profile/head", ["module", "require", "exports", "core/component", "core/i18n", "app/ui/with_user_actions", "app/ui/with_profile_stats", "app/ui/with_handle_overflow", "app/ui/with_editable_header", "core/utils"], function(module, require, exports) {
    function profileHead() {
        this.defaultAttrs({
            avatarSelector: ".avatar:not(.empty-avatar)",
            profileHeaderInnerSelector: ".profile-header-inner",
            itemType: "user",
            directMessages: ".dm-button"
        }), this.showDirectMessageDialog = function(a, b) {
            this.trigger("uiNeedsDMDialog"), a.preventDefault()
        }, this.showAvatarModal = function(a) {
            a.preventDefault();
            if (this.isEditing()) return;
            this.trigger(a.target, "uiOpenGallery", {
                title: _('@{{screenName}}\'s profile photo', {
                    screenName: this.attr.profile_user.screen_name
                })
            })
        }, this.addGlowToEnvelope = function(a, b) {
            this.select("directMessages").addClass("new")
        }, this.removeGlowFromEnvelope = function(a, b) {
            this.select("directMessages").removeClass("new")
        }, this.after("initialize", function() {
            this.checkForOverflow(this.select("profileHeaderInnerSelector")), this.on("click", {
                avatarSelector: this.showAvatarModal,
                directMessages: this.showDirectMessageDialog
            }), this.on(document, "dataUserHasUnreadDMs", this.addGlowToEnvelope), this.on(document, "dataUserHasNoUnreadDMs", this.removeGlowFromEnvelope), this.attr.eventData = utils.merge(this.attr.eventData || {}, {
                scribeContext: {
                    component: "profile_follow_card"
                },
                profileHead: !0
            })
        })
    }
    var defineComponent = require("core/component"),
        _ = require("core/i18n"),
        withUserActions = require("app/ui/with_user_actions"),
        withProfileStats = require("app/ui/with_profile_stats"),
        withHandleOverflow = require("app/ui/with_handle_overflow"),
        withEditableHeader = require("app/ui/with_editable_header"),
        utils = require("core/utils");
    module.exports = defineComponent(profileHead, withUserActions, withProfileStats, withHandleOverflow, withEditableHeader)
});
define("app/ui/media/card_thumbnails", ["module", "require", "exports", "core/component", "core/utils", "app/utils/image_thumbnail", "app/utils/image/image_loader", "app/utils/full_path", "core/i18n"], function(module, require, exports) {
    function cardThumbnails() {
        var a = 800,
            b = {
                NOT_LOADED: "not-loaded",
                LOADING: "loading",
                LOADED: "loaded"
            };
        this.hasMoreItems = !0, this.defaultAttrs({
            profileUser: !1,
            mediaGrid: !1,
            mediaGridOpen: !1,
            gridPushState: !1,
            pushStateUrl: "/",
            defaultGalleryTitle: _('Media Gallery'),
            viewAllSelector: ".list-link",
            thumbnailSelector: ".media-thumbnail",
            thumbnailContainerSelector: ".photo-list",
            thumbnailPlaceholderSelector: ".thumbnail-placeholder.first",
            thumbnailNotLoadedSelector: '.media-thumbnail[data-load-status="' + b.NOT_LOADED + '"]',
            thumbnailType: "thumb",
            thumbnailSize: 90,
            thumbnailsVisible: 6,
            showAllInlineMedia: !1,
            loadOnEventName: "uiLoadThumbnails",
            dataEvents: {
                requestItems: "uiWantsMoreMediaTimelineItems",
                gotItems: "dataGotMoreMediaTimelineItems"
            },
            defaultRequestData: {}
        }), this.thumbs = function() {
            return this.select("thumbnailSelector")
        }, this.getMaxId = function() {
            var a = this.thumbs();
            if (a.length) return a.last().attr("data-status-id")
        }, this.shouldGetMoreItems = function(a) {
            var b = $(a.target);
            if (b.attr("data-paged")) return;
            this.getMoreItems()
        }, this.getMoreItems = function() {
            if (!this.hasMoreItems) return;
            var a = this.thumbs();
            a.attr("data-paged", !0), this.trigger(document, this.attr.dataEvents.requestItems, utils.merge(this.attr.defaultRequestData, {
                max_id: this.getMaxId()
            }))
        }, this.gotMoreItems = function(a, b) {
            if (b.thumbs_html && b.thumbs_html.length) {
                var c = $.isArray(b.thumbs_html) ? $(b.thumbs_html.join("")) : $(b.thumbs_html);
                this.appendItems(c)
            } else this.hasMoreItems = !1;
            this.trigger(document, "dataGotMoreMediaItems", b), this.select("thumbnailSelector").length < this.attr.thumbnailsVisible && this.hasMoreItems && this.getMoreItems()
        }, this.appendItems = function(a) {
            this.attr.gridPushState && (a.addClass("js-nav"), a.attr("href", this.attr.pushStateUrl)), this.select("thumbnailPlaceholderSelector").before(a), this.renderVisible()
        }, this.renderVisible = function() {
            var a = this.select("thumbnailSelector").slice(0, this.attr.thumbnailsVisible),
                b = a.filter(this.attr.thumbnailNotLoadedSelector);
            if (b.length) {
                this.loadThumbs(b);
                var c = {
                    thumbnails: []
                };
                b.each(function(a, b) {
                    c.thumbnails.push($(b).attr("data-url"))
                }), this.trigger("uiMediaThumbnailsVisible", c)
            } else a.length > 0 && this.showThumbs();
            var c = {
                thumbnails: []
            };
            b.each(function(a, b) {
                c.thumbnails.push($(b).attr("data-url"))
            }), this.trigger("uiMediaThumbnailsVisible", c)
        }, this.loadThumbs = function(a) {
            a.attr("data-load-status", b.LOADING), a.each(this.loadThumb.bind(this))
        }, this.loadThumb = function(a, b) {
            var c = $(b),
                d = function(a) {
                    this.loadThumbSuccess(c, a)
                }.bind(this),
                e = function() {
                    this.loadThumbFail(c)
                }.bind(this);
            imageLoader.load(c.attr("data-resolved-url-" + this.attr.thumbnailType), d, e)
        }, this.loadThumbSuccess = function(a, c) {
            a.attr("data-load-status", b.LOADED), c.css(imageThumbnail.getThumbnailOffset(c.get(0).height, c.get(0).width, this.attr.thumbnailSize)), a.append(c), this.showThumbs()
        }, this.loadThumbFail = function(a) {
            a.remove(), this.renderVisible()
        }, this.showThumbs = function() {
            this.$node.show(), this.$node.attr("data-loaded", !0), this.gridAutoOpen()
        }, this.thumbnailClick = function(a) {
            a.stopPropagation(), a.preventDefault(), this.openGallery(a.target);
            var b = $(a.target),
                c = b.hasClass("video") ? "video" : "photo";
            this.trigger("uiMediaThumbnailClick", {
                url: b.attr("data-url"),
                mediaType: c
            })
        }, this.gridAutoOpen = function() {
            this.attr.mediaGrid && this.attr.mediaGridOpen && this.thumbs().length && this.viewGrid()
        }, this.viewAllClick = function(a) {
            this.attr.mediaGrid ? this.trigger("uiMediaViewAllClick") : (this.openGallery(this.thumbs()[0]), a.preventDefault())
        }, this.showThumbs = function() {
            this.$node.show(), this.$node.attr("data-loaded", !0), this.attr.mediaGridOpen && (this.attr.mediaGridOpen = !1, this.viewGrid())
        }, this.viewGrid = function() {
            this.openGrid(this.thumbs()[0])
        }, this.openGrid = function(a) {
            this.trigger(a, "uiOpenGrid", {
                gridTitle: this.attr.defaultGalleryTitle,
                profileUser: this.attr.profileUser
            })
        }, this.openGallery = function(a) {
            this.trigger(a, "uiOpenGallery", {
                gridTitle: this.attr.defaultGalleryTitle,
                showGrid: this.attr.mediaGrid,
                profileUser: this.attr.profileUser
            })
        }, this.after("initialize", function() {
            this.$node.attr("data-loaded") || (this.$node.hide(), this.trigger("uiMediaThumbnailsVisible", {
                thumbnails: []
            })), this.attr.showAllInlineMedia ? this.on("componentInitialized", this.getMoreItems) : this.on(document, "uiReloadThumbs", this.getMoreItems), this.on("componentTearDown", function() {
                this.thumbs().remove()
            }.bind(this)), this.on("click", {
                thumbnailSelector: this.thumbnailClick,
                viewAllSelector: this.viewAllClick
            }), this.gridAutoOpen(), this.on(document, this.attr.dataEvents.gotItems, this.gotMoreItems), this.on("uiGalleryMediaLoad", this.shouldGetMoreItems)
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        imageThumbnail = require("app/utils/image_thumbnail"),
        imageLoader = require("app/utils/image/image_loader"),
        fullPath = require("app/utils/full_path"),
        _ = require("core/i18n"),
        CardThumbnails = defineComponent(cardThumbnails);
    module.exports = CardThumbnails
});
define("app/data/media_timeline", ["module", "require", "exports", "core/component", "core/utils", "app/data/with_data"], function(module, require, exports) {
    function mediaTimeline() {
        this.requestItems = function(a, b) {
            var c = {}, d = {
                since_id: b.since_id,
                max_id: b.max_id
            };
            this.get({
                url: this.attr.endpoint,
                headers: c,
                data: d,
                eventData: b,
                success: "dataGotMoreMediaTimelineItems",
                error: "dataGotMoreMediaTimelineItemsError"
            })
        }, this.after("initialize", function(a) {
            this.on(document, "uiWantsMoreMediaTimelineItems", this.requestItems)
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        withData = require("app/data/with_data");
    module.exports = defineComponent(mediaTimeline, withData)
});
define("app/data/media_thumbnails_scribe", ["module", "require", "exports", "core/component", "app/data/with_scribe", "core/utils"], function(module, require, exports) {
    function mediaThumbnailsScribe() {
        var a = /\:[A-Z0-9_-]+$/i;
        this.scribeMediaThumbnailResults = function(b, c) {
            var d = c.thumbnails.length,
                e = d ? "results" : "no_results",
                f = {
                    item_count: d
                };
            d && (f.item_names = c.thumbnails.map(function(b) {
                return b.replace(a, "")
            })), this.scribe({
                action: e
            }, c, f)
        }, this.scribeMediaThumbnailClick = function(b, c) {
            var d = {
                url: c.url && c.url.replace(a, "")
            }, e = {
                element: c.mediaType,
                action: "click"
            };
            this.scribe(e, c, d)
        }, this.scribeMediaViewAllClick = function(a, b) {
            this.scribe({
                action: "view_all"
            }, b)
        }, this.after("initialize", function() {
            this.on(document, "uiMediaThumbnailsVisible", this.scribeMediaThumbnailResults), this.on(document, "uiMediaThumbnailClick", this.scribeMediaThumbnailClick), this.on(document, "uiMediaViewAllClick", this.scribeMediaViewAllClick)
        })
    }
    var defineComponent = require("core/component"),
        withScribe = require("app/data/with_scribe"),
        utils = require("core/utils");
    module.exports = defineComponent(mediaThumbnailsScribe, withScribe)
});
define("app/ui/suggested_users", ["module", "require", "exports", "core/component", "app/ui/with_user_actions", "app/ui/with_item_actions", "app/ui/with_interaction_data"], function(module, require, exports) {
    function suggestedUsers() {
        this.defaultAttrs({
            closeSelector: ".js-close",
            itemType: "user",
            userSelector: ".js-actionable-user"
        }), this.slideInContent = function(a, b) {
            if (this.$node.hasClass("has-content")) return;
            this.$node.addClass("has-content"), this.$node.html(b.html), this.$node.hide().slideDown();
            var c = [];
            this.$node.find(this.attr.userSelector).map(function(a, b) {
                c.push(this.interactionData($(b), {
                    position: a
                }))
            }.bind(this)), this.trigger("uiSuggestedUsersRendered", {
                items: c
            })
        }, this.slideOutContent = function(a, b) {
            this.$node.slideUp(function() {
                this.$node.empty(), this.$node.removeClass("has-content")
            }.bind(this))
        }, this.after("initialize", function() {
            this.on(document, "dataSuggestedUsersSuccess", this.slideInContent), this.on("click", {
                closeSelector: this.slideOutContent
            })
        })
    }
    var defineComponent = require("core/component"),
        withUserActions = require("app/ui/with_user_actions"),
        withItemActions = require("app/ui/with_item_actions"),
        withInteractionData = require("app/ui/with_interaction_data");
    module.exports = defineComponent(suggestedUsers, withUserActions, withItemActions, withInteractionData)
});
define("app/data/suggested_users", ["module", "require", "exports", "core/component", "app/data/with_data", "app/data/with_interaction_data_scribe"], function(module, require, exports) {
    function suggestedUsersData() {
        this.getHTML = function(a, b) {
            function c(a) {
                a.html && this.trigger("dataSuggestedUsersSuccess", a)
            }
            if (!b || !b.profileHead) return;
            this.get({
                url: "/i/users/suggested_users",
                data: {
                    user_id: b.userId,
                    limit: 2
                },
                eventData: b,
                success: c.bind(this),
                error: "dataSuggestedUsersFailure"
            })
        }, this.scribeSuggestedUserResults = function(a, b) {
            this.scribeInteractiveResults({
                element: "initial",
                action: "results"
            }, b.items, b, {
                referring_event: "initial"
            })
        }, this.after("initialize", function() {
            this.on("uiSuggestedUsersRendered", this.scribeSuggestedUserResults), this.on("uiFollowAction", this.getHTML)
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data"),
        withInteractionDataScribe = require("app/data/with_interaction_data_scribe");
    module.exports = defineComponent(suggestedUsersData, withData, withInteractionDataScribe)
});
define("app/ui/gallery/grid", ["module", "require", "exports", "core/component", "core/utils", "core/i18n", "app/utils/image_thumbnail", "app/utils/image/image_loader", "app/ui/with_scrollbar_width"], function(module, require, exports) {
    function grid() {
        this.defaultAttrs({
            thumbnailSize: 196,
            gridTitle: _('Media Gallery'),
            gridPushState: !0,
            pushStateCloseUrl: "/",
            profileUser: !1,
            mediaSelector: ".media-thumbnail",
            mediasSelector: ".photo-list",
            gridHeaderSelector: ".grid-header",
            gridTitleSelector: ".header-title",
            gridSubTitleSelector: ".header-subtitle",
            gridPicSelector: ".header-pic .avatar",
            gridSelector: ".grid-media",
            gridContainerSelector: ".grid-container",
            closeSelector: ".action-close",
            gridFooterSelector: ".grid-footer",
            gridLoadingSelector: ".grid-loading"
        }), this.atBottom = !1, this.isOpen = function() {
            return this.select("gridContainerSelector").is(":visible")
        }, this.open = function(a, b) {
            this.calculateScrollbarWidth();
            if (b.fromGallery) {
                this.show();
                return
            }
            b && b.gridTitle && (this.attr.gridTitle = b.gridTitle), this.$mediaContainer = $(a.target).closest(this.attr.mediasSelector);
            var c = this.$mediaContainer.find(this.attr.mediaSelector);
            this.select("mediaSelector").remove(), this.populate(c), this.initHeader(), this.select("gridContainerSelector").on("scroll", utils.throttle(this.onScroll.bind(this), 200)), $("body").addClass("grid-enabled"), this.trigger("uiGridOpened")
        }, this.loadMore = function(a, b) {
            if (this.isOpen() && b.thumbs_html && b.thumbs_html.length) {
                var c = $.isArray(b.thumbs_html) ? $(b.thumbs_html.join("")) : $(b.thumbs_html);
                this.populate(c), this.trigger("uiGridPaged")
            } else if (!b.thumbs_html || !b.thumbs_html.length) this.atBottom = !0, this.loadComplete(), this.processGrid(!0)
        }, this.initHeader = function() {
            this.attr.profileUser ? (this.$node.addClass("tall"), this.select("gridSubTitleSelector").text("@" + this.attr.profileUser.screen_name), this.select("gridPicSelector").attr("src", this.attr.profileUser.profile_image_url_https), this.select("gridPicSelector").attr("alt", this.attr.profileUser.name)) : (this.$node.removeClass("tall"), this.select("gridSubTitleSelector").text(""), this.select("gridPicSelector").attr("src", ""), this.select("gridPicSelector").attr("alt", "")), this.select("gridTitleSelector").text(this.attr.gridTitle), this.attr.gridPushState ? (this.select("gridSubTitleSelector").attr("href", this.attr.pushStateCloseUrl), this.select("gridTitleSelector").attr("href", this.attr.pushStateCloseUrl)) : (this.select("gridSubTitleSelector").removeClass("js-nav"), this.select("gridTitleSelector").removeClass("js-nav"))
        }, this.show = function() {
            $("body").addClass("grid-enabled"), setTimeout(function() {
                this.ignoreEsc = !1
            }.bind(this), 400)
        }, this.hide = function() {
            $("body").removeClass("grid-enabled"), this.ignoreEsc = !0
        }, this.onEsc = function(a) {
            this.ignoreEsc || this.close(a)
        }, this.close = function(a) {
            a.stopPropagation(), a.preventDefault(), this.select("gridContainerSelector").scrollTop(0), $("body").removeClass("grid-enabled"), this.select("gridContainerSelector").off("scroll"), this.trigger("uiGridClosed"), this.ignoreEsc = !1
        }, this.populate = function(a) {
            var b = a.clone();
            b.find("img").remove(), b.removeClass("js-nav"), b.removeAttr("href"), b.find(".play").removeClass("play").addClass("play-large"), b.insertBefore(this.select("gridFooterSelector")), this.processGrid(), b.each(function(a, b) {
                this.renderMedia(b)
            }.bind(this)), this.$mediaContainer.attr("data-grid-processed", "true"), this.onScroll()
        }, this.onScroll = function(a) {
            if (this.atBottom) return;
            var b = this.select("gridContainerSelector").scrollTop();
            if (this.select("gridContainerSelector").get(0).scrollHeight < b + $(window).height() + SCROLLTHRESHOLD) {
                var c = this.getLast();
                c.attr("data-grid-paged") || (c.attr("data-grid-paged", "true"), this.trigger(this.getLast(), "uiGalleryMediaLoad"))
            }
        }, this.loadComplete = function() {
            this.$node.addClass("load-complete")
        }, this.getLast = function() {
            var a = this.select("mediaSelector").last(),
                b = a.attr("data-status-id");
            return this.$mediaContainer.find(".media-thumbnail[data-status-id='" + b + "']")
        }, this.medias = function() {
            return this.select("mediaSelector")
        }, this.unprocessedMedias = function() {
            return this.medias().filter(":not([data-grid-processed='true'])")
        }, this.processGrid = function(a) {
            var b = this.unprocessedMedias();
            if (!b.length) return;
            var c = 0,
                d = 0,
                e = [];
            for (var f = 0; f < b.length; f++) {
                var g = $(b[f]);
                !c && (c = parseInt(g.attr("data-height"))), a && (c = GRIDHEIGHT), d += this.scaleGridMedia(g, c), e.push(g);
                if (d / c >= GRIDRATIO || a) a && (d = GRIDWIDTH), this.setGridRow(e, d, c), d = 0, c = 0, e = [], this.processGrid()
            }
        }, this.scaleGridMedia = function(a, b) {
            var c = parseInt(a.attr("data-height")),
                d = parseInt(a.attr("data-width")),
                e = b / c * d;
            return d / c > PANORATIO && (e = b * PANORATIO, a.attr("data-pano", "true")), a.attr({
                "scaled-height": b,
                "scaled-width": e
            }), e
        }, this.setGridRow = function(a, b, c) {
            var d = GRIDWIDTH - a.length * GRIDMARGIN,
                e = d / b,
                f = c * e;
            $.each(a, function(a, b) {
                var c = parseInt(b.attr("scaled-width")) * e;
                b.height(f), b.width(c), b.attr("scaled-height", f), b.attr("Scaled-width", c), b.attr("data-grid-processed", "true"), b.addClass("enabled"), a == 0 && b.addClass("clear")
            })
        }, this.renderMedia = function(a) {
            var b = $(a),
                c = function(a) {
                    this.loadThumbSuccess(b, a)
                }.bind(this),
                d = function() {
                    this.loadThumbFail(b)
                }.bind(this);
            imageLoader.load(b.attr("data-resolved-url-small"), c, d)
        }, this.loadThumbSuccess = function(a, b) {
            if (a.attr("data-pano")) {
                var c = a.height() / parseInt(a.attr("data-height")) * parseInt(a.attr("data-width"));
                b.width(c), b.css("margin-left", -(c - a.width()) / 2 + "px")
            }
            a.prepend(b)
        }, this.loadThumbFail = function(a) {
            a.remove()
        }, this.openGallery = function(a) {
            var b = $(a.target).closest(this.attr.mediaSelector),
                c = b.attr("data-status-id"),
                d = this.$mediaContainer.find(".media-thumbnail[data-status-id='" + c + "']");
            this.trigger(d, "uiOpenGallery", {
                title: this.title,
                fromGrid: !0
            }), this.hide()
        }, this.after("initialize", function() {
            this.ignoreEsc = !0, this.on(document, "uiOpenGrid", this.open), this.on(document, "uiCloseGrid", this.close), this.on(document, "dataGotMoreMediaItems", this.loadMore), this.on("click", {
                mediaSelector: this.openGallery,
                closeSelector: this.close
            }), this.attr.gridPushState || (this.on(document, "uiShortcutEsc", this.onEsc), this.on("click", {
                gridTitleSelector: this.close,
                gridSubTitleSelector: this.close,
                gridPicSelector: this.close
            }))
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        _ = require("core/i18n"),
        imageThumbnail = require("app/utils/image_thumbnail"),
        imageLoader = require("app/utils/image/image_loader"),
        withScrollbarWidth = require("app/ui/with_scrollbar_width"),
        Grid = defineComponent(grid, withScrollbarWidth),
        GRIDWIDTH = 824,
        GRIDMARGIN = 12,
        GRIDHEIGHT = 210,
        GRIDRATIO = 3.5,
        PANORATIO = 3,
        SCROLLTHRESHOLD = 1e3;
    module.exports = Grid
});
define("app/boot/profile", ["module", "require", "exports", "app/boot/app", "core/i18n", "app/boot/trends", "app/boot/logged_out", "app/boot/inline_edit", "app/ui/profile/head", "app/ui/dashboard_tweetbox", "app/ui/who_to_follow/who_to_follow_dashboard", "app/data/who_to_follow", "app/data/who_to_follow_scribe", "app/ui/media/card_thumbnails", "app/data/media_timeline", "app/data/media_thumbnails_scribe", "core/utils", "app/ui/suggested_users", "app/data/suggested_users", "app/data/client_event", "app/ui/navigation_links", "app/boot/wtf_module", "app/ui/dialogs/uz_survey", "app/ui/gallery/grid"], function(module, require, exports) {
    function initialize(a) {
        bootApp(a), a.showTrends && trends(a), a.showWhoToFollowModule && whoToFollowModule(a), a.inlineProfileEditing && inlineEditBoot(a), clientEvent.scribeData.profile_id = a.profile_id, ProfileHead.attachTo(".profile-card", a), loggedOutBoot(a), uzSurvey.attachTo("#uz_logged_out_profile_survey"), MediaThumbnailsScribe.attachTo(document, a);
        var b = {
            showAllInlineMedia: !0,
            defaultGalleryTitle: a.profile_user.name,
            profileUser: a.profile_user,
            mediaGrid: a.mediaGrid,
            mediaGridOpen: a.mediaGridOpen,
            gridPushState: a.mediaGrid,
            pushStateUrl: "/" + a.profile_user.screen_name + "/media/grid",
            eventData: {
                scribeContext: {
                    component: "dashboard_media"
                }
            }
        }, c;
        c = ".enhanced-media-thumbnails", b.thumbnailSize = 90, b.thumbnailsVisible = 6, MediaTimeline.attachTo(document, {
            endpoint: "/i/profiles/show/" + a.profile_user.screen_name + "/media_timeline"
        }), CardThumbnails.attachTo(c, utils.merge(a, b)), Grid.attachTo(".grid", {
            sandboxes: a.sandboxes,
            loggedIn: a.loggedIn,
            eventData: {
                scribeContext: {
                    component: "grid"
                }
            },
            mediaGridOpen: a.mediaGridOpen,
            pushStateCloseUrl: "/" + a.profile_user.screen_name,
            gridTitle: _('{{name}}\'s photos and videos', {
                name: a.profile_user.name
            }),
            profileUser: a.profile_user
        }), NavigationLinks.attachTo(".profile-card", {
            eventData: {
                scribeContext: {
                    component: "profile_follow_card"
                }
            }
        }), DashboardTweetbox.attachTo(".profile-tweet-box", {
            draftTweetId: "profile_" + a.profile_id,
            eventData: {
                scribeContext: {
                    component: "tweet_box"
                }
            }
        });
        var d = utils.merge(a, {
            eventData: {
                scribeContext: {
                    component: "similar_user_recommendations"
                }
            }
        }),
            e = ".dashboard .js-similar-to-module";
        WhoToFollowDashboard.attachTo(e, d), WhoToFollowData.attachTo(e, d), WhoToFollowScribe.attachTo(e, d), SuggestedUsersData.attachTo(document), SuggestedUsers.attachTo("#suggested-users", utils.merge({
            eventData: {
                scribeContext: {
                    component: "user_similarities_list"
                }
            }
        }, a))
    }
    var bootApp = require("app/boot/app"),
        _ = require("core/i18n"),
        trends = require("app/boot/trends"),
        loggedOutBoot = require("app/boot/logged_out"),
        inlineEditBoot = require("app/boot/inline_edit"),
        ProfileHead = require("app/ui/profile/head"),
        DashboardTweetbox = require("app/ui/dashboard_tweetbox"),
        WhoToFollowDashboard = require("app/ui/who_to_follow/who_to_follow_dashboard"),
        WhoToFollowData = require("app/data/who_to_follow"),
        WhoToFollowScribe = require("app/data/who_to_follow_scribe"),
        CardThumbnails = require("app/ui/media/card_thumbnails"),
        MediaTimeline = require("app/data/media_timeline"),
        MediaThumbnailsScribe = require("app/data/media_thumbnails_scribe"),
        utils = require("core/utils"),
        SuggestedUsers = require("app/ui/suggested_users"),
        SuggestedUsersData = require("app/data/suggested_users"),
        clientEvent = require("app/data/client_event"),
        NavigationLinks = require("app/ui/navigation_links"),
        whoToFollowModule = require("app/boot/wtf_module"),
        uzSurvey = require("app/ui/dialogs/uz_survey"),
        Grid = require("app/ui/gallery/grid");
    module.exports = initialize
});
define("app/pages/profile/tweets", ["module", "require", "exports", "app/boot/profile", "app/boot/tweet_timeline", "core/utils"], function(module, require, exports) {
    var profileBoot = require("app/boot/profile"),
        tweetTimelineBoot = require("app/boot/tweet_timeline"),
        utils = require("core/utils");
    module.exports = function(b) {
        profileBoot(b), tweetTimelineBoot(utils.merge(b, {
            pinPromotedTweets: !0
        }), b.timeline_url, "tweet"), b.profile_user && $(document).trigger("profileVisit", b.profile_user)
    }
});
define("app/ui/timelines/with_cursor_pagination", ["module", "require", "exports", "app/utils/string"], function(module, require, exports) {
    function withCursorPagination() {
        function a() {
            return !0
        }
        function b() {
            return !1
        }
        this.isOldItem = a, this.isNewItem = b, this.wasRangeRequest = b, this.wasNewItemsRequest = b, this.wasOldItemsRequest = a, this.shouldGetOldItems = function() {
            return !!this.cursor
        }, this.getOldItemsData = function() {
            return {
                cursor: this.cursor,
                is_forward: !this.attr.isBackward,
                query: this.query
            }
        }, this.resetStateVariables = function(a) {
            a && a.cursor !== undefined ? (this.cursor = a.cursor, this.select("containerSelector").attr("data-cursor", this.cursor)) : this.cursor = this.select("containerSelector").attr("data-cursor") || ""
        }, this.after("initialize", function(a) {
            this.query = a.query || "", this.resetStateVariables(), this.on("uiTimelineReset", this.resetStateVariables)
        })
    }
    var string = require("app/utils/string");
    module.exports = withCursorPagination
});
define("app/ui/timelines/user_timeline", ["module", "require", "exports", "core/component", "app/ui/timelines/with_base_timeline", "app/ui/timelines/with_old_items", "app/ui/timelines/with_cursor_pagination", "app/ui/with_item_actions", "app/ui/with_user_actions"], function(module, require, exports) {
    function userTimeline() {
        this.defaultAttrs({
            itemType: "user"
        })
    }
    var defineComponent = require("core/component"),
        withBaseTimeline = require("app/ui/timelines/with_base_timeline"),
        withOldItems = require("app/ui/timelines/with_old_items"),
        withCursorPagination = require("app/ui/timelines/with_cursor_pagination"),
        withItemActions = require("app/ui/with_item_actions"),
        withUserActions = require("app/ui/with_user_actions");
    module.exports = defineComponent(userTimeline, withBaseTimeline, withOldItems, withCursorPagination, withItemActions, withUserActions)
});
define("app/boot/user_timeline", ["module", "require", "exports", "app/boot/timeline", "app/ui/timelines/user_timeline", "core/utils"], function(module, require, exports) {
    function initialize(a, b, c, d) {
        var e = utils.merge(a, {
            endpoint: b,
            itemType: c,
            eventData: {
                scribeContext: {
                    component: d
                }
            }
        });
        timelineBoot(e), UserTimeline.attachTo("#timeline", e)
    }
    var timelineBoot = require("app/boot/timeline"),
        UserTimeline = require("app/ui/timelines/user_timeline"),
        utils = require("core/utils");
    module.exports = initialize
});
define("app/ui/timelines/follower_request_timeline", ["module", "require", "exports", "core/component", "app/ui/with_interaction_data", "core/i18n"], function(module, require, exports) {
    function followerRequestTimeline() {
        this.defaultAttrs({
            userItemSelector: "div.js-follower-request",
            streamUserItemSelector: "li.js-stream-item",
            followerActionsSelector: ".friend-actions",
            profileActionsSelector: ".js-profile-actions",
            acceptFollowerSelector: ".js-action-accept",
            declineFollowerSelector: ".js-action-deny",
            itemType: "user"
        }), this.findUser = function(a) {
            return this.$node.find(this.attr.userItemSelector + "[data-user-id=" + a + "]")
        }, this.findFollowerActions = function(a) {
            return this.findUser(a).find(this.attr.followerActionsSelector)
        }, this.findProfileActions = function(a) {
            return this.findUser(a).find(this.attr.profileActionsSelector)
        }, this.handleAcceptSuccess = function(a, b) {
            this.findFollowerActions(b.userId).hide(), this.findProfileActions(b.userId).show()
        }, this.handleDeclineSuccess = function(a, b) {
            var c = this.findUser(b.userId);
            c.closest(this.attr.streamUserItemSelector).remove()
        }, this.handleDecisionFailure = function(a, b) {
            var c = this.findFollowerActions(b.userId);
            c.find(".btn").attr("disabled", !1).removeClass("pending")
        }, this.handleFollowerDecision = function(a) {
            return function(b, c) {
                b.preventDefault(), b.stopPropagation();
                var d = this.interactionData(b),
                    e = this.findFollowerActions(d.userId);
                e.find(".btn").attr("disabled", !0);
                var f = e.find(a == "Accept" ? this.attr.acceptFollowerSelector : this.attr.declineFollowerSelector);
                f.addClass("pending"), this.trigger("uiDidFollower" + a, d)
            }
        }, this.after("initialize", function() {
            this.on("click", {
                acceptFollowerSelector: this.handleFollowerDecision("Accept"),
                declineFollowerSelector: this.handleFollowerDecision("Decline")
            }), this.on(document, "dataFollowerAcceptSuccess", this.handleAcceptSuccess), this.on(document, "dataFollowerDeclineSuccess", this.handleDeclineSuccess), this.on(document, "dataFollowerAcceptFailure dataFollowerDeclineFailure", this.handleDecisionFailure)
        })
    }
    var defineComponent = require("core/component"),
        withInteractionData = require("app/ui/with_interaction_data"),
        _ = require("core/i18n");
    module.exports = defineComponent(followerRequestTimeline, withInteractionData)
});
define("app/data/follower_request", ["module", "require", "exports", "core/component", "app/data/with_data"], function(module, require, exports) {
    function followerRequestData() {
        this.followerRequestAction = function(a, b) {
            return function(c, d) {
                var e = function() {
                    this.trigger("dataFollower" + b + "Success", {
                        userId: d.userId
                    })
                }.bind(this),
                    f = function() {
                        this.trigger("dataFollower" + b + "Failure", {
                            userId: d.userId
                        })
                    }.bind(this);
                this.post({
                    url: a,
                    data: {
                        user_id: d.userId
                    },
                    eventData: d,
                    success: e,
                    error: f
                })
            }
        }, this.after("initialize", function(a) {
            this.on(document, "uiDidFollowerAccept", this.followerRequestAction("/i/user/accept", "Accept")), this.on(document, "uiDidFollowerDecline", this.followerRequestAction("/i/user/deny", "Decline"))
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data");
    module.exports = defineComponent(followerRequestData, withData)
});
define("app/pages/profile/follower_requests", ["module", "require", "exports", "app/boot/profile", "app/boot/user_timeline", "app/ui/timelines/follower_request_timeline", "app/data/follower_request"], function(module, require, exports) {
    var profileBoot = require("app/boot/profile"),
        userTimelineBoot = require("app/boot/user_timeline"),
        FollowerRequestTimeline = require("app/ui/timelines/follower_request_timeline"),
        FollowerRequestData = require("app/data/follower_request");
    module.exports = function(b) {
        profileBoot(b), userTimelineBoot(b, b.timeline_url, "user"), FollowerRequestTimeline.attachTo("#timeline", b), FollowerRequestData.attachTo(document, b)
    }
});
define("app/pages/profile/followers", ["module", "require", "exports", "app/boot/profile", "app/boot/user_timeline", "app/data/contact_import", "app/data/contact_import_scribe", "app/ui/who_to_follow/import_loading_dialog", "app/ui/who_to_follow/import_services"], function(module, require, exports) {
    var profileBoot = require("app/boot/profile"),
        userTimelineBoot = require("app/boot/user_timeline"),
        ContactImportData = require("app/data/contact_import"),
        ContactImportScribe = require("app/data/contact_import_scribe"),
        ImportLoadingDialog = require("app/ui/who_to_follow/import_loading_dialog"),
        ImportServices = require("app/ui/who_to_follow/import_services");
    module.exports = function(b) {
        profileBoot(b), userTimelineBoot(b, b.timeline_url, "user", "user"), ContactImportData.attachTo(document, b), ContactImportScribe.attachTo(document, b), ImportLoadingDialog.attachTo("#import-loading-dialog", b), ImportServices.attachTo(".followers-import-prompt", {
            launchServiceSelector: ".js-launch-service"
        })
    }
});
define("app/pages/profile/following", ["module", "require", "exports", "app/boot/profile", "app/boot/user_timeline"], function(module, require, exports) {
    var profileBoot = require("app/boot/profile"),
        userTimelineBoot = require("app/boot/user_timeline");
    module.exports = function(b) {
        profileBoot(b), userTimelineBoot(b, b.timeline_url, "user", "user")
    }
});
define("app/pages/profile/favorites", ["module", "require", "exports", "app/boot/profile", "app/boot/tweet_timeline"], function(module, require, exports) {
    var profileBoot = require("app/boot/profile"),
        tweetTimelineBoot = require("app/boot/tweet_timeline");
    module.exports = function(b) {
        profileBoot(b), tweetTimelineBoot(b, b.timeline_url, "tweet")
    }
});
define("app/ui/timelines/list_timeline", ["module", "require", "exports", "core/component", "app/ui/timelines/with_base_timeline", "app/ui/timelines/with_old_items", "app/ui/timelines/with_cursor_pagination", "app/ui/with_item_actions", "app/ui/with_user_actions"], function(module, require, exports) {
    function listTimeline() {
        this.defaultAttrs({
            createListSelector: ".js-create-list-button",
            itemType: "list"
        }), this.after("initialize", function(a) {
            this.on("click", {
                createListSelector: this.openListCreateDialog
            })
        }), this.openListCreateDialog = function() {
            this.trigger("uiOpenCreateListDialog", {
                userId: this.userId
            })
        }
    }
    var defineComponent = require("core/component"),
        withBaseTimeline = require("app/ui/timelines/with_base_timeline"),
        withOldItems = require("app/ui/timelines/with_old_items"),
        withCursorPagination = require("app/ui/timelines/with_cursor_pagination"),
        withItemActions = require("app/ui/with_item_actions"),
        withUserActions = require("app/ui/with_user_actions");
    module.exports = defineComponent(listTimeline, withBaseTimeline, withOldItems, withCursorPagination, withItemActions, withUserActions)
});
define("app/boot/list_timeline", ["module", "require", "exports", "app/boot/timeline", "app/ui/timelines/list_timeline", "core/utils"], function(module, require, exports) {
    function initialize(a, b, c, d) {
        var e = utils.merge(a, {
            endpoint: b,
            itemType: c,
            eventData: {
                scribeContext: {
                    component: d
                }
            }
        });
        timelineBoot(e), ListTimeline.attachTo("#timeline", e)
    }
    var timelineBoot = require("app/boot/timeline"),
        ListTimeline = require("app/ui/timelines/list_timeline"),
        utils = require("core/utils");
    module.exports = initialize
});
define("app/pages/profile/lists", ["module", "require", "exports", "app/boot/profile", "app/boot/list_timeline"], function(module, require, exports) {
    var profileBoot = require("app/boot/profile"),
        listTimelineBoot = require("app/boot/list_timeline");
    module.exports = function(b) {
        profileBoot(b), listTimelineBoot(b, b.timeline_url, "list")
    }
});
define("app/ui/with_stream_users", ["module", "require", "exports"], function(module, require, exports) {
    function withStreamUsers() {
        this.defaultAttrs({
            streamUserSelector: ".stream-items .js-actionable-user"
        }), this.usersDisplayed = function() {
            var a = this.select("streamUserSelector"),
                b = [];
            a.each(function(a, c) {
                var d = $(c);
                b.push({
                    id: d.attr("data-user-id"),
                    impressionId: d.attr("data-impression-id")
                })
            }), this.trigger("uiUsersDisplayed", {
                users: b
            })
        }, this.after("initialize", function() {
            this.usersDisplayed()
        })
    }
    module.exports = withStreamUsers
});
define("app/ui/with_removable_stream_items", ["module", "require", "exports", "core/utils"], function(module, require, exports) {
    function withRemovableStreamItems() {
        this.defaultAttrs({
            streamItemSelector: ".js-stream-item"
        }), this.removeStreamItem = function(a) {
            var b = this.attr.streamItemSelector + "[data-item-id=" + a + "]";
            this.$node.find(b).remove()
        }
    }
    var utils = require("core/utils");
    module.exports = withRemovableStreamItems
});
define("app/ui/similar_to", ["module", "require", "exports", "core/component", "app/ui/with_stream_users", "app/ui/with_removable_stream_items"], function(module, require, exports) {
    function similarTo() {
        this.handleUserActionSuccess = function(a, b) {
            b.requestUrl == "/i/user/hide" && this.removeStreamItem(b.userId)
        }, this.after("initialize", function() {
            this.on(document, "dataUserActionSuccess", this.handleUserActionSuccess)
        })
    }
    var defineComponent = require("core/component"),
        withStreamUsers = require("app/ui/with_stream_users"),
        withRemovableStreamItems = require("app/ui/with_removable_stream_items");
    module.exports = defineComponent(similarTo, withStreamUsers, withRemovableStreamItems)
});
define("app/pages/profile/similar_to", ["module", "require", "exports", "app/boot/profile", "app/boot/user_timeline", "app/ui/similar_to"], function(module, require, exports) {
    var profileBoot = require("app/boot/profile"),
        userTimelineBoot = require("app/boot/user_timeline"),
        similarTo = require("app/ui/similar_to");
    module.exports = function(b) {
        profileBoot(b), userTimelineBoot(b, b.timeline_url, "user", "user"), similarTo.attachTo("#timeline")
    }
});
define("app/data/facets", ["module", "require", "exports", "core/component", "app/data/with_data"], function(module, require, exports) {
    function dataFacets() {
        this.getFacets = function(a, b) {
            this.get({
                url: "/i/search/facets",
                data: b,
                eventData: b,
                success: "dataHasFacets",
                error: "dataHasFacetsError"
            })
        }, this.after("initialize", function() {
            this.on("uiNeedsFacets", this.getFacets)
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data");
    module.exports = defineComponent(dataFacets, withData)
});
define("app/ui/facets", ["module", "require", "exports", "app/utils/cookie", "core/component"], function(module, require, exports) {
    function uiFacets() {
        this.defaultAttrs({
            topImagesSelector: ".top-images",
            topVideosSelector: ".top-videos",
            notDisplayedSelector: ".facets-media-not-displayed",
            displayMediaSelector: ".display-this-media",
            showAllInlineMedia: !1
        }), this.addFacets = function(a, b) {
            this.select("topImagesSelector").html(b.photos), this.select("topVideosSelector").html(b.videos), this.attr.showAllInlineMedia && this.reloadFacets()
        }, this.showFacet = function(a, b) {
            b.thumbnails.length > 0 && $(a.target).show();
            var c = this.$node.find(".js-nav-links>li:visible"),
                d = c.last();
            c.removeClass("last-item"), d.addClass("last-item")
        }, this.dismissDisplayMedia = function() {
            this.attr.showAllInlineMedia = !0, this.setMediaCookie(), this.select("notDisplayedSelector").hide(), this.reloadFacets()
        }, this.setMediaCookie = function() {
            cookie("show_all_inline_media", !0)
        }, this.reloadFacets = function() {
            this.trigger(this.select("topImagesSelector"), "uiReloadThumbs"), this.trigger(this.select("topVideosSelector"), "uiReloadThumbs")
        }, this.after("initialize", function(a) {
            this.on(document, "dataHasFacets", this.addFacets), this.on("uiMediaThumbnailsVisible", this.showFacet), this.on("click", {
                displayMediaSelector: this.dismissDisplayMedia
            }), this.trigger("uiNeedsFacets", {
                q: a.query,
                onebox_type: a.oneboxType
            })
        })
    }
    var cookie = require("app/utils/cookie"),
        defineComponent = require("core/component");
    module.exports = defineComponent(uiFacets)
});
define("app/data/facets_timeline", ["module", "require", "exports", "core/component", "core/utils", "app/data/with_data"], function(module, require, exports) {
    function facetsTimeline() {
        this.defaultAttrs({
            query: ""
        }), this.requestItems = function(a, b) {
            var c = {}, d = {
                since_id: b.since_id,
                max_id: b.max_id,
                facet_type: b.facet_type,
                onebox_type: b.onebox_type,
                q: this.attr.query
            };
            this.get({
                url: this.attr.endpoint,
                headers: c,
                data: d,
                eventData: b,
                success: "dataGotMoreFacet" + b.facet_type + "TimelineItems",
                error: "dataGotMoreFacet" + b.facet_type + "TimelineItemsError"
            })
        }, this.after("initialize", function(a) {
            this.on(document, "uiWantsMoreFacetTimelineItems", this.requestItems)
        })
    }
    var defineComponent = require("core/component"),
        utils = require("core/utils"),
        withData = require("app/data/with_data");
    module.exports = defineComponent(facetsTimeline, withData)
});
define("app/ui/dialogs/iph_search_result_dialog", ["module", "require", "exports", "core/component", "app/ui/with_dialog", "app/ui/with_position", "app/data/with_scribe", "app/data/ddg"], function(module, require, exports) {
    function inProductHelpDialog() {
        this.defaultAttrs({
            helpfulSelector: "#helpful_button",
            notHelpfulSelector: "#not_helpful_button",
            inProductHelpSelector: "#search_result_help",
            feedbackQuestionSelector: "#satisfaction_question",
            feedbackButtonsSelector: "#satisfaction_buttons",
            feedbackMessageSelector: "#satisfaction_feedback"
        }), this.openDialog = function(a) {
            ddg.impression("in_product_help_search_result_page_392"), this.scribe({
                component: "search_result",
                element: "learn_more_dialog",
                action: "impression"
            }), this.open()
        }, this.voteHelpful = function(a) {
            this.scribe({
                component: "search_result",
                element: "learn_more_dialog",
                action: a ? "helpful" : "unhelpful"
            }), this.select("feedbackQuestionSelector").hide(), this.select("feedbackButtonsSelector").hide(), this.select("feedbackMessageSelector").fadeIn()
        }, this.after("initialize", function() {
            this.on("click", {
                helpfulSelector: function() {
                    this.voteHelpful(!0)
                },
                notHelpfulSelector: function() {
                    this.voteHelpful(!1)
                }
            }), this.on(this.attr.inProductHelpSelector, "click", this.openDialog), this.select("feedbackMessageSelector").hide()
        })
    }
    var defineComponent = require("core/component"),
        withDialog = require("app/ui/with_dialog"),
        withPosition = require("app/ui/with_position"),
        withScribe = require("app/data/with_scribe"),
        ddg = require("app/data/ddg");
    module.exports = defineComponent(inProductHelpDialog, withDialog, withPosition, withScribe)
});
define("app/boot/search", ["module", "require", "exports", "app/boot/app", "app/boot/logged_out", "core/utils", "app/boot/wtf_module", "app/boot/trends", "core/i18n", "app/data/facets", "app/ui/facets", "app/data/media_thumbnails_scribe", "app/ui/media/card_thumbnails", "app/data/facets_timeline", "app/ui/navigation_links", "app/ui/dialogs/iph_search_result_dialog", "app/ui/dialogs/uz_survey", "app/data/client_event"], function(module, require, exports) {
    var bootApp = require("app/boot/app"),
        loggedOutBoot = require("app/boot/logged_out"),
        utils = require("core/utils"),
        whoToFollowModule = require("app/boot/wtf_module"),
        trends = require("app/boot/trends"),
        _ = require("core/i18n"),
        dataFacets = require("app/data/facets"),
        uiFacets = require("app/ui/facets"),
        MediaThumbnailsScribe = require("app/data/media_thumbnails_scribe"),
        CardThumbnails = require("app/ui/media/card_thumbnails"),
        FacetsTimeline = require("app/data/facets_timeline"),
        NavigationLinks = require("app/ui/navigation_links"),
        InProductHelpDialog = require("app/ui/dialogs/iph_search_result_dialog"),
        uzSurvey = require("app/ui/dialogs/uz_survey"),
        clientEvent = require("app/data/client_event");
    module.exports = function(b) {
        bootApp(b), loggedOutBoot(b), clientEvent.scribeData.query = b.query, uzSurvey.attachTo("#uz_logged_out_search_survey"), b.showWhoToFollowModule && whoToFollowModule(b), trends(b), MediaThumbnailsScribe.attachTo(document, b), FacetsTimeline.attachTo(document, {
            endpoint: "/i/search/facets",
            query: b.query
        }), CardThumbnails.attachTo(".top-images", utils.merge(b, {
            thumbnailSize: 66,
            thumbnailsVisible: 4,
            loadOnEventName: "uiLoadThumbnails",
            defaultGalleryTitle: _('Top photos for "{{query}}"', {
                query: b.query
            }),
            profileUser: !1,
            mediaGrid: !1,
            dataEvents: {
                requestItems: "uiWantsMoreFacetTimelineItems",
                gotItems: "dataGotMoreFacetimagesTimelineItems"
            },
            defaultRequestData: {
                facet_type: "images",
                onebox_type: b.oneboxType
            },
            eventData: {
                scribeContext: {
                    component: "dashboard_photos"
                }
            }
        })), CardThumbnails.attachTo(".top-videos", utils.merge(b, {
            thumbnailSize: 66,
            thumbnailsVisible: 4,
            loadOnEventName: "uiLoadThumbnails",
            defaultGalleryTitle: _('Top videos for "{{query}}"', {
                query: b.query
            }),
            profileUser: !1,
            mediaGrid: !1,
            dataEvents: {
                requestItems: "uiWantsMoreFacetTimelineItems",
                gotItems: "dataGotMoreFacetvideosTimelineItems"
            },
            defaultRequestData: {
                facet_type: "videos",
                onebox_type: b.oneboxType
            },
            eventData: {
                scribeContext: {
                    component: "dashboard_videos"
                }
            }
        })), uiFacets.attachTo(".dashboard", utils.merge(b, {
            thumbnailLoadEvent: "uiLoadThumbnails"
        })), InProductHelpDialog.attachTo("#in_product_help_dialog"), NavigationLinks.attachTo(".search-nav", {
            eventData: {
                scribeContext: {
                    component: "stream_nav"
                }
            }
        }), NavigationLinks.attachTo(".js-related-queries", {
            eventData: {
                scribeContext: {
                    component: "related_queries"
                }
            }
        }), NavigationLinks.attachTo(".js-spelling-corrections", {
            eventData: {
                scribeContext: {
                    component: "spelling_corrections"
                }
            }
        })
    }
});
define("app/data/user_search", ["module", "require", "exports", "core/component", "app/data/with_data"], function(module, require, exports) {
    function userSearchData() {
        this.defaultAttrs({
            query: null
        }), this.makeUserSearchModuleRequest = function() {
            if (!this.attr.query) return;
            var a = {
                q: this.attr.query
            };
            this.get({
                url: "/i/search/top_users/",
                data: a,
                eventData: a,
                success: "dataUserSearchContent",
                error: "dataUserSearchContentError"
            })
        }, this.after("initialize", function() {
            this.on("uiRefreshUserSearchModule", this.makeUserSearchModuleRequest)
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data");
    module.exports = defineComponent(userSearchData, withData)
});
define("app/data/user_search_scribe", ["module", "require", "exports", "core/component", "app/data/with_scribe", "app/utils/scribe_item_types"], function(module, require, exports) {
    function userSearchDataScribe() {
        this.scribeResults = function(a, b) {
            var c = {
                action: "impression"
            };
            this.scribe(c, b);
            var d = {};
            c.element = b.element, b.items && b.items.length ? (c.action = "results", d = {
                items: b.items.map(function(a, b) {
                    return {
                        id: a,
                        item_type: itemTypes.user,
                        position: b
                    }
                })
            }) : c.action = "no_results", this.scribe(c, b, d)
        }, this.scribeUserSearch = function(a, b) {
            this.scribe({
                action: "search"
            }, b)
        }, this.after("initialize", function() {
            this.on("uiUserSearchModuleDisplayed", this.scribeResults), this.on("uiUserSearchNavigation", this.scribeUserSearch)
        })
    }
    var defineComponent = require("core/component"),
        withScribe = require("app/data/with_scribe"),
        itemTypes = require("app/utils/scribe_item_types");
    module.exports = defineComponent(userSearchDataScribe, withScribe)
});
define("app/ui/user_search", ["module", "require", "exports", "core/component", "app/ui/with_item_actions"], function(module, require, exports) {
    function userSearchModule() {
        this.defaultAttrs({
            peopleLinkSelector: "a.list-link",
            avatarRowSelector: ".avatar-row",
            userThumbSelector: ".user-thumb",
            itemType: "user"
        }), this.updateContent = function(a, b) {
            var c = this.select("peopleLinkSelector");
            c.find(this.attr.avatarRowSelector).remove(), c.append(b.users_module), this.userItemsDisplayed()
        }, this.userItemsDisplayed = function() {
            var a = this.select("userThumbSelector").map(function() {
                return $(this).data("user-id") + ""
            }).toArray();
            this.trigger("uiUserSearchModuleDisplayed", {
                items: a,
                element: "initial"
            })
        }, this.searchForUsers = function(a, b) {
            a.target == b.el && this.trigger("uiUserSearchNavigation")
        }, this.getItemPosition = function(a) {
            return a.closest(this.attr.userThumbSelector).index()
        }, this.after("initialize", function() {
            this.on(document, "dataUserSearchContent", this.updateContent), this.on("click", {
                peopleLinkSelector: this.searchForUsers
            }), this.trigger("uiRefreshUserSearchModule")
        })
    }
    var defineComponent = require("core/component"),
        withItemActions = require("app/ui/with_item_actions");
    module.exports = defineComponent(userSearchModule, withItemActions)
});
define("app/data/saved_searches", ["module", "require", "exports", "core/component", "app/data/with_data", "app/data/with_auth_token"], function(module, require, exports) {
    function savedSearches() {
        this.saveSearch = function(a, b) {
            this.post({
                url: "/i/saved_searches/create.json",
                data: b,
                headers: {
                    "X-PHX": !0
                },
                eventData: "",
                success: "dataAddedSavedSearch",
                error: $.noop
            })
        }, this.removeSavedSearch = function(a, b) {
            this.post({
                url: "/i/saved_searches/destroy/" + encodeURIComponent(b.id) + ".json",
                data: "",
                headers: {
                    "X-PHX": !0
                },
                eventData: "",
                success: "dataRemovedSavedSearch",
                error: $.noop
            })
        }, this.after("initialize", function(a) {
            this.on("uiAddSavedSearch", this.saveSearch), this.on("uiRemoveSavedSearch", this.removeSavedSearch)
        })
    }
    var defineComponent = require("core/component"),
        withData = require("app/data/with_data"),
        withAuthToken = require("app/data/with_auth_token");
    module.exports = defineComponent(savedSearches, withData, withAuthToken)
});
define("app/ui/search_dropdown", ["module", "require", "exports", "core/component", "core/i18n", "app/ui/with_dropdown"], function(module, require, exports) {
    function searchDropdown() {
        this.defaultAttrs({
            toggler: ".js-search-dropdown",
            saveOrRemoveSelector: ".js-toggle-saved-search-link",
            savedSearchSelector: ".js-saved-search",
            unsavedSearchSelector: ".js-unsaved-search",
            searchTitleSelector: ".search-title",
            advancedSearchSelector: ".advanced-search",
            embedSearchSelector: ".embed-search"
        }), this.addSavedSearch = function(a, b) {
            this.trigger("uiAddSavedSearch", {
                query: $(a.target).data("query")
            })
        }, this.removeSavedSearch = function(a, b) {
            this.savedSearchId = $(a.target).data("id"), this.trigger("uiOpenConfirmDialog", {
                titleText: _('Remove saved search'),
                bodyText: _('Are you sure you want to remove this search?'),
                cancelText: _('No'),
                submitText: _('Yes'),
                action: "SavedSearchRemove"
            })
        }, this.confirmSavedSearchRemoval = function() {
            if (!this.savedSearchId) return;
            this.trigger("uiRemoveSavedSearch", {
                id: this.savedSearchId
            })
        }, this.savedSearchRemoved = function(a, b) {
            this.select("saveOrRemoveSelector").removeClass("js-saved-search").addClass("js-unsaved-search").text(_('Save search'));
            var c = $(this.attr.searchTitleSelector).find(".search-query").text();
            c = $("<div/>").text(c).html(), $(this.attr.searchTitleSelector).html(_('Results for <strong class="search-query">{{query}}</strong>', {
                query: c
            }))
        }, this.navigatePage = function(a, b) {
            this.trigger("uiNavigate", {
                href: $(a.target).attr("href")
            })
        }, this.savedSearchAdded = function(a, b) {
            this.select("saveOrRemoveSelector").removeClass("js-unsaved-search").addClass("js-saved-search").text(_('Remove saved search')).data("id", b.id);
            var c = $(this.attr.searchTitleSelector).find(".search-query").text();
            c = $("<div/>").text(c).html(), $(this.attr.searchTitleSelector).html(_('Saved search: <strong class="search-query">{{query}}</strong>', {
                query: c
            }))
        }, this.after("initialize", function(a) {
            this.on("click", {
                advancedSearchSelector: this.navigatePage,
                embedSearchSelector: this.navigatePage,
                savedSearchSelector: this.removeSavedSearch,
                unsavedSearchSelector: this.addSavedSearch
            }), this.on(document, "uiSavedSearchRemoveConfirm", this.confirmSavedSearchRemoval), this.on(document, "dataAddedSavedSearch", this.savedSearchAdded), this.on(document, "dataRemovedSavedSearch", this.savedSearchRemoved)
        })
    }
    var defineComponent = require("core/component"),
        _ = require("core/i18n"),
        withDropdown = require("app/ui/with_dropdown");
    module.exports = defineComponent(searchDropdown, withDropdown)
});
define("app/data/story_scribe", ["module", "require", "exports", "core/component", "app/data/with_interaction_data_scribe"], function(module, require, exports) {
    function storyScribe() {
        this.defaultAttrs({
            t1dScribeErrors: !1,
            t1dScribeTimes: !1
        }), this.scribeCardSearchClick = function(a, b) {
            this.scribeInteraction({
                element: "topic",
                action: "search"
            }, b)
        }, this.scribeCardNewsClick = function(a, b) {
            var c = {};
            b.tcoUrl && (c.message = b.tcoUrl), b.text && b.text.indexOf("pic.twitter.com") == 0 && (b.url = "http://" + b.text), this.scribeInteraction({
                element: "article",
                action: "open_link"
            }, b, c)
        }, this.scribeCardMediaClick = function(a, b) {
            this.scribeInteraction({
                element: b.storyMediaType,
                action: "click"
            }, b)
        }, this.scribeTweetStory = function(a, b) {
            this.scribeInteraction({
                element: "tweet_link",
                action: a.type === "uiStoryTweetSent" ? "success" : "click"
            }, b)
        }, this.scribeCardImageLoadTime = function(a, b) {
            this.attr.t1dScribeTimes && this.scribe({
                component: "topic_story",
                action: "complete"
            }, b)
        }, this.scribeCardImageLoadError = function(a, b) {
            this.attr.t1dScribeErrors && this.scribe({
                component: "topic_story",
                action: "error"
            }, b)
        }, this.after("initialize", function() {
            this.on("uiCardMediaClick", this.scribeCardMediaClick), this.on("uiCardNewsClick", this.scribeCardNewsClick), this.on("uiCardSearchClick", this.scribeCardSearchClick), this.on("uiTweetStoryLinkClicked uiStoryTweetSent", this.scribeTweetStory), this.on("uiCardImageLoaded", this.scribeCardImageLoadTime), this.on("uiCardImageLoadError", this.scribeCardImageLoadError)
        })
    }
    var defineComponent = require("core/component"),
        withInterationDataScribe = require("app/data/with_interaction_data_scribe");
    module.exports = defineComponent(storyScribe, withInterationDataScribe)
});
define("app/data/onebox_scribe", ["module", "require", "exports", "core/component", "app/data/with_scribe"], function(module, require, exports) {
    function oneboxScribe() {
        this.scribeOneboxImpression = function(a, b) {
            var c = {
                component: b.type,
                action: "impression"
            };
            this.scribe(c);
            if (b.items) {
                var d = {
                    item_count: b.items.length,
                    item_ids: b.items
                };
                c.action = b.items.length ? "results" : "no_results", this.scribe(c, b, d)
            }
        }, this.scribeViewAllClick = function(a, b) {
            var c = {
                component: b.type,
                action: "view_all"
            };
            this.scribe(c, b)
        }, this.scribeEventOneboxClick = function(a, b) {
            this.scribe({
                component: "event",
                section: "onebox",
                action: "click"
            }, b)
        }, this.after("initialize", function() {
            this.on("uiOneboxDisplayed", this.scribeOneboxImpression), this.on("uiOneboxViewAllClick", this.scribeViewAllClick), this.on("uiEventOneboxClick", this.scribeEventOneboxClick)
        })
    }
    var defineComponent = require("core/component"),
        withScribe = require("app/data/with_scribe");
    module.exports = defineComponent(oneboxScribe, withScribe)
});
define("app/ui/with_story_clicks", ["module", "require", "exports", "core/utils", "core/compose", "app/ui/with_interaction_data"], function(module, require, exports) {
    function withStoryClicks() {
        compose.mixin(this, [withInteractionData]), this.defaultAttrs({
            cardSearchSelector: ".js-action-card-search",
            cardNewsSelector: ".js-action-card-news",
            cardMediaSelector: ".js-action-card-media",
            cardHeadlineSelector: ".js-news-headline .js-action-card-news",
            tweetLinkButtonSelector: ".story-social-new-tweet",
            storyItemContainerSelector: ".js-story-item"
        }), this.getLinkData = function(a) {
            var b = $(a).closest("[data-url]");
            return {
                url: b.attr("data-url"),
                tcoUrl: $(a).closest("a[href]").attr("href"),
                text: b.text()
            }
        }, this.cardSearchClick = function(a, b) {
            this.trigger("uiCardSearchClick", this.interactionData(a, this.getLinkData(a.target)))
        }, this.cardNewsClick = function(a, b) {
            var c = $(a.target);
            this.trigger("uiCardNewsClick", this.interactionData(a, this.getLinkData(a.target)))
        }, this.cardMediaClick = function(a, b) {
            this.trigger("uiCardMediaClick", this.interactionData(a, this.getLinkData(a.target)))
        }, this.selectStory = function(a, b) {
            var c = a.type === "uiHasExpandedStory" ? "uiItemSelected" : "uiItemDeselected",
                d = $(a.target).find(this.attr.storyItemContainerSelector),
                e = this.interactionData(d);
            e.scribeContext.element = e.storySource === "trends" ? "top_tweets" : "social_context", this.trigger(c, e)
        }, this.tweetSent = function(a, b) {
            var c = b.in_reply_to_status_id;
            if (c) {
                var d = this.$node.find(".open " + this.attr.storyItemSelector).has(".tweet[data-tweet-id=" + c + "]");
                if (!d.length) return;
                var e = this.getItemData(d, c, "reply");
                this.trigger("uiStoryTweetAction", e)
            } else {
                var d = this.$node.find(this.attr.storyItemSelector + '[data-query="' + b.customData.query + '"]');
                if (!d.length) return;
                this.trigger("uiStoryTweetSent", this.interactionData(d))
            }
        }, this.tweetSelectedStory = function(a, b) {
            var c = $(b.el).closest(this.attr.storyItemSelector),
                d = this.interactionData(c);
            this.trigger("uiOpenTweetDialog", {
                defaultText: " " + c.data("url"),
                cursorPosition: 0,
                customData: {
                    query: c.data("query")
                },
                scribeContext: d.scribeContext
            }), this.trigger("uiTweetStoryLinkClicked", this.interactionData(c))
        }, this.getCardPosition = function(a) {
            var b;
            return this.select("storyItemSelector").each(function(c) {
                if ($(this).attr("data-query") === a) return b = c, !1
            }), b
        }, this.getItemData = function(a, b, c) {
            var d = $(a).closest(this.attr.storyItemSelector),
                e = d.find(this.attr.cardHeadlineSelector),
                f = d.data("query"),
                g = [];
            d.find(".tweet[data-tweet-id]").each(function() {
                g.push($(this).data("tweet-id"))
            });
            var h = {
                cardType: d.data("story-type"),
                query: f,
                title: e.text().trim(),
                tweetIds: g,
                cardMediaType: d.data("card-media-type"),
                position: this.getCardPosition(f),
                href: e.attr("href"),
                source: d.data("source"),
                tweetId: b,
                action: c
            };
            return h
        }, this.after("initialize", function() {
            this.on("click", {
                cardSearchSelector: this.cardSearchClick,
                cardNewsSelector: this.cardNewsClick,
                cardMediaSelector: this.cardMediaClick,
                tweetLinkButtonSelector: this.tweetSelectedStory
            }), this.on(document, "uiTweetSent", this.tweetSent), this.on("uiHasCollapsedStory uiHasExpandedStory", this.selectStory)
        })
    }
    var utils = require("core/utils"),
        compose = require("core/compose"),
        withInteractionData = require("app/ui/with_interaction_data");
    module.exports = withStoryClicks
});
deferred('$lib/jquery_autoellipsis.js', function() {
    /*! Autoellipsis (c) 2011 Peter van der Spek https://raw.github.com/pvdspek/jquery.autoellipsis/master/MIT-LICENSE.txt */
    (function($) {
        function e(a, b) {
            var c = a.data("jqae");
            c || (c = {});
            var d = c.wrapperElement;
            d || (d = a.wrapInner("<div/>").find(">div"));
            var e = d.data("jqae");
            e || (e = {});
            var i = e.originalContent;
            i ? d = e.originalContent.clone(!0).data("jqae", {
                originalContent: i
            }).replaceAll(d) : d.data("jqae", {
                originalContent: d.clone(!0)
            }), a.data("jqae", {
                wrapperElement: d,
                containerWidth: a.innerWidth(),
                containerHeight: a.innerHeight()
            });
            var j = !1,
                k = d;
            b.selector && (k = $(d.find(b.selector).get().reverse())), k.each(function() {
                var c = $(this),
                    e = c.text(),
                    i = !1;
                if (d.innerHeight() - c.innerHeight() > a.innerHeight()) c.remove();
                else {
                    h(c);
                    if (c.contents().length) {
                        j && (g(c).get(0).nodeValue += b.ellipsis, j = !1);
                        while (d.innerHeight() > a.innerHeight()) {
                            i = f(c);
                            if (!i) {
                                j = !0, c.remove();
                                break
                            }
                            h(c);
                            if (!c.contents().length) {
                                j = !0, c.remove();
                                break
                            }
                            g(c).get(0).nodeValue += b.ellipsis
                        }
                        b.setTitle == "onEllipsis" && i || b.setTitle == "always" ? c.attr("title", e) : b.setTitle != "never" && c.removeAttr("title")
                    }
                }
            })
        }
        function f(a) {
            var b = g(a);
            if (b.length) {
                var c = b.get(0).nodeValue,
                    d = c.lastIndexOf(" ");
                return d > -1 ? (c = $.trim(c.substring(0, d)), b.get(0).nodeValue = c) : b.get(0).nodeValue = "", !0
            }
            return !1
        }
        function g(a) {
            if (a.contents().length) {
                var b = a.contents(),
                    c = b.eq(b.length - 1);
                return c.filter(i).length ? c : g(c)
            }
            a.append("");
            var b = a.contents();
            return b.eq(b.length - 1)
        }
        function h(a) {
            if (a.contents().length) {
                var b = a.contents(),
                    c = b.eq(b.length - 1);
                if (c.filter(i).length) {
                    var d = c.get(0).nodeValue;
                    return d = $.trim(d), d == "" ? (c.remove(), !0) : !1
                }
                while (h(c));
                return c.contents().length ? !1 : (c.remove(), !0)
            }
            return !1
        }
        function i() {
            return this.nodeType === 3
        }
        function j(c, d) {
            a[c] = d, b || (b = window.setInterval(function() {
                l()
            }, 200))
        }
        function k(c) {
            a[c] && (delete a[c], a.length || b && (window.clearInterval(b), b = undefined))
        }
        function l() {
            if (!c) {
                c = !0;
                for (var b in a) $(b).each(function() {
                    var c, d;
                    c = $(this), d = c.data("jqae"), (d.containerWidth != c.innerWidth() || d.containerHeight != c.innerHeight()) && e(c, a[b])
                });
                c = !1
            }
        }
        var a = {}, b, c = !1,
            d = {
                ellipsis: "...",
                setTitle: "never",
                live: !1
            };
        $.fn.ellipsis = function(a, b) {
            var c, f;
            return c = $(this), typeof a != "string" && (b = a, a = undefined), f = $.extend({}, d, b), f.selector = a, c.each(function() {
                var a = $(this);
                e(a, f)
            }), f.live ? j(c.selector, f) : k(c.selector), this
        }
    })(jQuery)
});
define("app/utils/ellipsis", ["module", "require", "exports", "$lib/jquery_autoellipsis.js"], function(module, require, exports) {
    require("$lib/jquery_autoellipsis.js");
    var isTextOverflowEllipsisSupported = "textOverflow" in $("<div>")[0].style,
        isEllipsisSupported = function(a) {
            return typeof a.forceEllipsisSupport == "boolean" ? a.forceEllipsisSupport : isTextOverflowEllipsisSupported
        }, singleLineEllipsis = function(a, b) {
            return isEllipsisSupported(b) ? !1 : ($(a).each(function() {
                var a = $(this);
                if (a.hasClass("ellipsify-container")) {
                    if (!b.force) return !0;
                    var c = a.find("span.ellip-content");
                    c.length && a.html(c.html())
                }
                a.addClass("ellipsify-container").wrapInner($("<span>").addClass("ellip-content"));
                var d = a.find("span.ellip-content");
                if (d.width() > a.width()) {
                    var e = $('<div class="ellip">&hellip;</div>');
                    a.append(e), d.width(a.width() - e.width()).css("margin-right", e.width())
                }
            }), !0)
        }, multilineEllipsis = function(a, b) {
            $(a).each(function(a, c) {
                var d = $(c);
                d.ellipsis(b.multilineSelector, b.multilineOptions);
                var e = d.find(">div"),
                    f = e.contents();
                d.append(f), e.remove()
            })
        }, ellipsify = function(a, b) {
            b = b || {};
            var c = b.multiline ? b.multilineFunction || multilineEllipsis : b.singlelineFunction || singleLineEllipsis;
            return c(a, b)
        };
    module.exports = ellipsify
});
define("app/ui/with_story_ellipsis", ["module", "require", "exports", "app/utils/ellipsis"], function(module, require, exports) {
    function withStoryEllipsis() {
        this.defaultAttrs({
            singleLineEllipsisSelector: "h3.js-story-title, p.js-metadata",
            multilineEllipsisSelector: "p.js-news-snippet, h3.js-news-headline, .cards-summary h3, .cards-summary .article",
            ellipsisChar: "&ellip;"
        }), this.ellipsify = function() {
            ellipsify(this.select("singleLineEllipsisSelector")), ellipsify(this.select("multilineEllipsisSelector"), {
                multiline: !0,
                multilineOptions: {
                    ellipsis: this.attr.ellipsisChar
                }
            })
        }
    }
    var ellipsify = require("app/utils/ellipsis");
    module.exports = withStoryEllipsis
});
define("app/ui/search/news_onebox", ["module", "require", "exports", "core/component", "app/ui/with_story_clicks", "app/ui/with_story_ellipsis"], function(module, require, exports) {
    function newsOnebox() {
        this.defaultAttrs({
            itemType: "story"
        }), this.oneboxDisplayed = function() {
            this.trigger("uiOneboxDisplayed", {
                type: "news_story"
            })
        }, this.after("initialize", function() {
            this.ellipsify(), this.oneboxDisplayed()
        })
    }
    var defineComponent = require("core/component"),
        withStoryClicks = require("app/ui/with_story_clicks"),
        withStoryEllipsis = require("app/ui/with_story_ellipsis");
    module.exports = defineComponent(newsOnebox, withStoryClicks, withStoryEllipsis)
});
define("app/ui/search/user_onebox", ["module", "require", "exports", "core/component", "app/ui/with_item_actions", "app/ui/with_story_clicks"], function(module, require, exports) {
    function userOnebox() {
        this.defaultAttrs({
            itemSelector: ".user-story-item",
            viewAllSelector: ".js-onebox-view-all",
            itemType: "story"
        }), this.oneboxDisplayed = function() {
            var a = {
                type: "user_story",
                items: this.getItemIds()
            };
            this.trigger("uiOneboxDisplayed", a)
        }, this.viewAllClicked = function() {
            this.trigger("uiOneboxViewAllClick", {
                type: "user_story"
            })
        }, this.getItemIds = function() {
            var a = [];
            return this.select("itemSelector").each(function() {
                var b = $(this);
                a.push(b.data("item-id"))
            }), a
        }, this.after("initialize", function() {
            this.on("click", {
                viewAllSelector: this.viewAllClicked
            }), this.oneboxDisplayed()
        })
    }
    var defineComponent = require("core/component"),
        withItemActions = require("app/ui/with_item_actions"),
        withStoryClicks = require("app/ui/with_story_clicks");
    module.exports = defineComponent(userOnebox, withItemActions, withStoryClicks)
});
define("app/ui/search/event_onebox", ["module", "require", "exports", "core/component"], function(module, require, exports) {
    function eventOnebox() {
        this.defaultAttrs({
            itemType: "story"
        }), this.oneboxDisplayed = function() {
            this.trigger("uiOneboxDisplayed", {
                type: "event_story"
            })
        }, this.broadcastClick = function(a) {
            this.trigger("uiEventOneboxClick")
        }, this.after("initialize", function() {
            this.oneboxDisplayed(), this.on("click", this.broadcastClick)
        })
    }
    var defineComponent = require("core/component");
    module.exports = defineComponent(eventOnebox)
});
define("app/ui/search/media_onebox", ["module", "require", "exports", "core/component", "core/i18n", "app/ui/with_story_clicks"], function(module, require, exports) {
    function mediaOnebox() {
        this.defaultAttrs({
            itemSelector: ".media-item",
            itemType: "story",
            query: ""
        }), this.oneboxDisplayed = function() {
            var a = {
                type: "media_story",
                items: this.getStatusIds()
            };
            this.trigger("uiOneboxDisplayed", a)
        }, this.getStatusIds = function() {
            var a = [];
            return this.select("itemSelector").each(function() {
                var b = $(this);
                a.push(b.data("status-id"))
            }), a
        }, this.mediaItemClick = function(a, b) {
            this.trigger(a.target, "uiOpenGallery", {
                title: _('Photos of {{query}}', {
                    query: this.attr.query
                })
            })
        }, this.after("initialize", function(a) {
            this.oneboxDisplayed(), this.on("click", this.mediaItemClick)
        })
    }
    var defineComponent = require("core/component"),
        _ = require("core/i18n"),
        withStoryClicks = require("app/ui/with_story_clicks");
    module.exports = defineComponent(mediaOnebox, withStoryClicks)
});
define("app/ui/search/spelling_corrections", ["module", "require", "exports", "core/component"], function(module, require, exports) {
    function SpellingCorrections() {
        this.defaultAttrs({
            dismissSelector: ".js-action-dismiss",
            spellingCorrectionSelector: ".corrected-query"
        }), this.dismissCorrection = function(a) {
            this.$node.fadeOut(250, function() {
                $(this).hide()
            }), this.scribeEvent("dismiss")
        }, this.clickCorrection = function(a) {
            this.scribeEvent("search")
        }, this.scribeEvent = function(a) {
            var b = this.select("spellingCorrectionSelector");
            this.trigger("uiSearchAssistanceAction", {
                component: "spelling_corrections",
                action: a,
                query: b.data("query"),
                item_names: [b.data("search-assistance")]
            })
        }, this.after("initialize", function() {
            this.on("click", {
                dismissSelector: this.dismissCorrection,
                spellingCorrectionSelector: this.clickCorrection
            })
        })
    }
    var defineComponent = require("core/component");
    module.exports = defineComponent(SpellingCorrections)
});
define("app/ui/search/related_queries", ["module", "require", "exports", "core/component"], function(module, require, exports) {
    function RelatedQueries() {
        this.defaultAttrs({
            relatedQuerySelector: ".related-query"
        }), this.relatedQueryClick = function(a) {
            this.trigger("uiSearchAssistanceAction", {
                component: "related_queries",
                action: "search",
                query: $(a.target).data("query"),
                item_names: [$(a.target).data("search-assistance")]
            })
        }, this.after("initialize", function() {
            this.on("click", {
                relatedQuerySelector: this.relatedQueryClick
            })
        })
    }
    var defineComponent = require("core/component");
    module.exports = defineComponent(RelatedQueries)
});
define("app/data/search_assistance_scribe", ["module", "require", "exports", "core/component", "app/data/with_scribe"], function(module, require, exports) {
    function SearchAssistanceScribe() {
        this.scribeSearchAssistance = function(a, b) {
            this.scribe({
                section: "search",
                component: b.component,
                action: b.action
            }, {
                query: b.query,
                item_names: b.item_names
            })
        }, this.after("initialize", function() {
            this.on("uiSearchAssistanceAction", this.scribeSearchAssistance)
        })
    }
    var defineComponent = require("core/component"),
        withScribe = require("app/data/with_scribe");
    module.exports = defineComponent(SearchAssistanceScribe, withScribe)
});
define("app/pages/search/search", ["module", "require", "exports", "app/boot/search", "core/utils", "app/boot/tweet_timeline", "app/data/user_search", "app/data/user_search_scribe", "app/ui/user_search", "app/data/saved_searches", "app/ui/search_dropdown", "app/data/story_scribe", "app/data/onebox_scribe", "app/ui/search/news_onebox", "app/ui/search/user_onebox", "app/ui/search/event_onebox", "app/ui/search/media_onebox", "app/data/client_event", "app/ui/search/spelling_corrections", "app/ui/search/related_queries", "app/data/search_assistance_scribe"], function(module, require, exports) {
    var searchBoot = require("app/boot/search"),
        utils = require("core/utils"),
        tweetTimelineBoot = require("app/boot/tweet_timeline"),
        UserSearchData = require("app/data/user_search"),
        UserSearchScribe = require("app/data/user_search_scribe"),
        UserSearchModule = require("app/ui/user_search"),
        SavedSearchesData = require("app/data/saved_searches"),
        SearchDropdown = require("app/ui/search_dropdown"),
        StoryScribe = require("app/data/story_scribe"),
        OneboxScribe = require("app/data/onebox_scribe"),
        NewsOnebox = require("app/ui/search/news_onebox"),
        UserOnebox = require("app/ui/search/user_onebox"),
        EventOnebox = require("app/ui/search/event_onebox"),
        MediaOnebox = require("app/ui/search/media_onebox"),
        clientEvent = require("app/data/client_event"),
        SpellingCorrections = require("app/ui/search/spelling_corrections"),
        RelatedQueries = require("app/ui/search/related_queries"),
        SearchAssistanceScribe = require("app/data/search_assistance_scribe");
    module.exports = function(b) {
        searchBoot(b), tweetTimelineBoot(utils.merge(b, {
            pinPromotedTweets: !0
        }), b.search_endpoint, "tweet"), SavedSearchesData.attachTo(document, b), SearchDropdown.attachTo(".js-search-dropdown", b), SpellingCorrections.attachTo(".search-assist-spelling"), RelatedQueries.attachTo(".search-assist-related-queries"), SearchAssistanceScribe.attachTo(document, b), UserSearchScribe.attachTo(document, b), UserSearchData.attachTo(document, b), UserSearchModule.attachTo(".js-nav-links .people", utils.merge(b, {
            eventData: {
                scribeContext: {
                    component: "user_search_module"
                }
            }
        })), StoryScribe.attachTo(document), OneboxScribe.attachTo(document, b), NewsOnebox.attachTo(".onebox .discover-item[data-story-type=news]"), UserOnebox.attachTo(".onebox .discover-item[data-story-type=user]", b), EventOnebox.attachTo(".onebox .discover-item[data-story-type=event]"), MediaOnebox.attachTo(".onebox .discover-item[data-story-type=media]", b)
    }
});
define("app/pages/simple_t1", ["module", "require", "exports", "app/boot/app"], function(module, require, exports) {
    var bootApp = require("app/boot/app");
    module.exports = function(a) {
        bootApp(a)
    }
});