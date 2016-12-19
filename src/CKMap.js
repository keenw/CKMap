/**
 * Created by CKeen on 2016/12/10.
 */
var CKMap = CKMap ||{};

/**
 * 配置项
 * */
(function(configs){
    CKMap.Configs = configs || {};
    CKMap.Configs.CarUri="trafficar_33.png";
})(CKMap.Configs);

/**
 * 实用类
 * */
(function(utils) {
    var X_PI = 3.14159265358979324 * 3000.0 / 180.0;
    var PI = 3.1415926535897932384626;
    var a = 6378245.0;
    var ee = 0.00669342162296594323;

    /**
     * 坐标系统:wsg84(GPS坐标系统),gcj02(国测，火星坐标系),bd09(百度坐标系)
     * 转换规则，GPS转换到火星坐标，火星坐标再转换到百度坐标
     * 中国地理范围：经度：72.004 -- 137.8347 ，维度：0.8293 -- 55.8271
     * */

    //火星坐标转百度度
    var Gcj02ToBd09 = function (gcjLat, gcjLng) {
        var x = +gcjLng;
        var y = +gcjLat;
        var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * X_PI);
        var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * X_PI);
        var bdLng = z * Math.cos(theta) + 0.0065;
        var bdLat = z * Math.sin(theta);
        return {"lat": bdLat, "lng": bdLng};
    };


    //百度转火星坐标
    var Bd09ToGcj02 = function (bdLat, bdLng) {
        var x = +bdLng - 0.0065;
        var y = +bdLat - 0.006;
        var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI);
        var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);
        var gcjLng = z * Math.cos(theta);
        var gcjLat = z * Math.sin(theta);
        return {"lat": gcjLat, "lng": gcjLng};
    };

    //判断是否在中国范围内
    var outOfChina = function (lat, lng) {
        var lat = +lat;
        var lng = +lng;
        return (lng > 72.004 && lng < 137.8347 && lat > 0.8293 && lat < 55.8271);
    };

    //纬度转换
    var transformLat = function (lat, lng) {
        var lat = +lat;
        var lng = +lng;
        var ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0;
        return ret;
    };

    //经度转换
    var transformLng = function (lat, lng) {
        var lat = +lat;
        var lng = +lng;
        var ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0;
        return ret
    };

    //GPS转火星坐标
    var Wgs84ToGcj02 = function (wgsLat, wgsLng) {
        var lat = +wgsLat;
        var lng = +wgsLng;
        if (outOfChina(lng, lat)) {
            return {"lat": lat, "lng": lng}
        } else {
            var dLat = transformLat(lat - 35.0, lng - 105.0);
            var dLng = transformLng(lat - 35.0, lng - 105.0);
            var radLat = lat / 180.0 * PI;
            var magic = Math.sin(radLat);
            magic = 1 - ee * magic * magic;
            var sqrtmagic = Math.sqrt(magic);
            dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
            dLng = (dLng * 180.0) / (a / sqrtmagic * Math.cos(radLat) * PI);
            var gcjLat = lat + dLat;
            var gjcLng = lng + dLng;
            return {"lat": gcjLat, "lng": gjcLng}
        }
    };

    //火星转GPS
    var Gcj02ToWgs84 = function (gcjLat, gcjLng) {
        var lat = +gcjLat;
        var lng = +gcjLng;
        var gPt = Wgs84ToGcj02(gcjLat, gcjLng);
        var dLat = gPt["lat"] - lat;
        var dLng = gPt["lng"] - lng;
        return {"lat": lat - dLat, "lng": lng - dLng};
    };

    var loadJScript = function(src) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = src;
        document.body.appendChild(script);
    }

    CKMap.Utils = utils || {};
    CKMap.Utils.Gcj02ToBd09 = Gcj02ToBd09;
    CKMap.Utils.Bd09ToGcj02 = Bd09ToGcj02;
    CKMap.Utils.Wgs84ToGcj02 = Wgs84ToGcj02;
    CKMap.Utils.Gcj02ToWgs84 = Gcj02ToWgs84;
    CKMap.Utils.loadJScript = loadJScript;
})(CKMap.Utils);

/*
* 工具类
* */
(function(tools){
    /*
    * 轨迹回放工具
    * */
    var TrackPlayer = function () {
        var timer = null;
        var mapPointList = [];
        var gpsFormatList = [];
        var currentIndex = 0;
        var maxCount = 0;

        var loop_callback = null;
        var completed_callback = null;

        var run = function () {
            if (mapPointList != null && mapPointList.length !== 0 && currentIndex <= maxCount - 1) {
                var point = mapPointList[currentIndex];
                if (point) {
                    (loop_callback && typeof (loop_callback) === "function") && loop_callback(point,gpsFormatList[currentIndex]);
                    timer = setTimeout(run, 1000);
                    currentIndex += 1;
                }
                else {
                    console.log("no point");
                }
            }

            if (currentIndex > maxCount - 1) {
                currentIndex = 0;
                maxCount = 0;
                clearTimeout(timer);
                timer = null;
                (completed_callback && typeof (completed_callback) === "function")
                && completed_callback(point,gpsFormatList[currentIndex]);
            }
        };

        return {
            /*
             * maplist_source[Array]:地图坐标
             * gpslist_source[Array]:gps坐标
             * loop[function]:每次移动的回调事件
             * completed[function]:完成之后的事件
             * */
            init: function (maplist_source,gpslist_source,loop,completed) {
                mapPointList = maplist_source;
                gpsFormatList = gpslist_source;
                maxCount = mapPointList.length;
                loop_callback = loop;
                completed_callback = completed;
            },
            start: function () {        //开始回放
                currentIndex = 0;
                if(timer){
                    clearTimeout(timer);
                    timer = null;
                }
                timer = setTimeout(run, 1000);
            },
            pause: function () {        //暂停回放
                clearTimeout(timer);
                timer = null;
            },
            goon: function () {         //继续回放
                if(timer){
                    clearTimeout(timer);
                    timer = null;
                }
                timer = setTimeout(run, 1000);
            },
            restart: function () {      //重新回放
                currentIndex = 0;
                if(timer){
                    clearTimeout(timer);
                    timer = null;
                }
                timer = setTimeout(run, 1000);
            },
            stop: function () {         //停止回放
                currentIndex = 0;
                maxCount = 0;
                clearTimeout(timer);
                timer = null;
            }
        }
    };
    CKMap.Tools = tools || {};
    CKMap.Tools.TrackPlayer = TrackPlayer;
})(CKMap.Tools);



(function(bdMap){

    var map = null;

    var init = function(mapContainer){
        CKMap.Utils.loadJScript("http://api.map.baidu.com/api?v=2.0&ak=270a17b702f3c85aa0e446856d96dc59");
        map = new BMap.Map(mapContainer);    // 创建Map实例
        map.addControl(new BMap.MapTypeControl());   //添加地图类型控件
        map.addControl(new BMap.NavigationControl({anchor: BMAP_ANCHOR_TOP_RIGHT}));
        //map.setCurrentCity("北京");          // 设置地图显示的城市 此项是必须设置的
        map.setMinZoom(5);
        map.enableScrollWheelZoom(true);     //开启鼠标滚轮缩放
        map.centerAndZoom(new BMap.Point(103.809721,36.052854), map.getZoom());  // 初始化地图,设置中心点坐标和地图级别
    };

    var MapIcons = {
        "car_icon":new BMap.Icon(CKMap.Configs.CarUri, new BMap.Size(35, 26)),
    }

    var MapMarkers = {
        "car_marker":new BMap.Marker(new BMap.Point(116.404, 39.915),{icon: MapIcons["car_icon"]}),
    }

    var AddTracker = function(pointlist){
        var polyLine = new BMap.Polyline(pointlist,{strokeColor:"blue", strokeWeight:3, strokeOpacity:0.5}); //创建弧线对象
        map.addOverlay(polyLine); //添加到地图中
    }

    var BDTrackPlayer = function(maplist,gpslist){
        var player = CKMap.Tools.TrackPlayer();
        var trackMarker = MapMarkers["car_marker"];
        player.init(maplist,gpslist,function(point,gpspoint){
            map.addOverlay(trackMarker);
            var point = new BMap.Point(point.lng,point.lat);
            trackMarker.setPosition(point);
            map.centerAndZoom(point,18);
        },function(point,gpspoint){
            map.removeOverlay(trackMarker);
        });

        return {
            start:function(){
                map.addOverlay(trackMarker);
                player.start();
            },
            pause:player.pause,
            goon:player.goon,
            restart:function(){
                player.restart();
            },
            stop:function(){
                player.stop();
                map.removeOverlay(trackMarker);
            }
        }
    };

    CKMap.BDMap = bdMap || {};
    CKMap.BDMap.init = init;
    CKMap.BDMap.addTrack = AddTracker;
    CKMap.BDMap.BDTrackPlayer = BDTrackPlayer;
})(CKMap.BDMap);

