/**
 * Created by CKeen on 2016/12/10.
 */


var CKMap = CKMap ||{};

(function(utill) {

    var X_PI = 3.14159265358979324 * 3000.0 / 180.0;
    var PI = 3.1415926535897932384626;
    var a = 6378245.0;
    var ee = 0.00669342162296594323;

    /**
     * ����ϵͳ:wsg84(GPS����),gcj02(���⣬��������ϵ),bd09(�ٶ�����)
     * ˵����wgs84��GPS�豸ԭʼ����ϵ
     *      gcj02�������ƫ�����Զ�wgs84����һ�μ�ƫ
     *      bd09���ٶȼ�ƫ����Ҫ�ڹ���������ٽ���һ�μ�ƫ
     *  �й���γ�ȷ�Χ��γ��3.86~53.55,����73.66~135.05
     * */

    //����ת�ٶ�
    var Gcj02ToBd09 = function (gcjLat, gcjLng) {
        var x = +gcjLng;
        var y = +gcjLat;
        var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * X_PI);
        var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * X_PI);
        var bdLng = z * Math.cos(theta) + 0.0065;
        var bdLat = z * Math.sin(theta);
        return {"lat": bdLat, "lng": bdLng};
    };


    //�ٶ�ת����
    var Bd09ToGcj02 = function (bdLat, bdLng) {
        var x = +bdLng - 0.0065;
        var y = +bdLat - 0.006;
        var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI);
        var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);
        var gcjLng = z * Math.cos(theta);
        var gcjLat = z * Math.sin(theta);
        return {"lat": gcjLat, "lng": gcjLng};
    };

    //˽�У��ж��Ƿ����й���Χ��
    var outOfChina = function (lat, lng) {
        var lat = +lat;
        var lng = +lng;
        return (lng > 72.004 && lng < 137.8347 && lat > 0.8293 && lat < 55.8271);
    };

    //˽�У��ж��Ƿ����й���Χ��
    var transformLat = function (lat, lng) {
        var lat = +lat;
        var lng = +lng;
        var ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0;
        return ret;
    };

    //˽�У��ж��Ƿ����й���Χ��
    var transformLng = function (lat, lng) {
        var lat = +lat;
        var lng = +lng;
        var ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0;
        return ret
    };

    //GPSת����
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

    //����תGPS
    var Gcj02ToWgs84 = function (gcjLat, gcjLng) {
        var lat = +gcjLat;
        var lng = +gcjLng;
        var gPt = Wgs84ToGcj02(gcjLat, gcjLng);
        var dLat = gPt["lat"] - lat;
        var dLng = gPt["lng"] - lng;
        return {"lat": lat - dLat, "lng": lng - dLng};
    };

    CKMap.Util = utill || {};
    CKMap.Util.Gcj02ToBd09 = Gcj02ToBd09;
    CKMap.Util.Bd09ToGcj02 = Bd09ToGcj02;
    CKMap.Util.Wgs84ToGcj02 = Wgs84ToGcj02;
    CKMap.Util.Gcj02ToWgs84 = Gcj02ToWgs84;
})(CKMap.Util);

/*
* ��������
* */
var throttle = function(fn,intetval){
    var __self = fn,
        timer,
        firstTime = true;

    return function(){
        var args = arguments,
            __me = this;

        if(firstTime){
            __self.apply(__me,args);
            return firstTime = false;
        }

        if(timer){
            return false;
        }

        timer = setTimeout(function(){
            clearTimeout(timer);
            timer = null;
            __self.apply(__me,args);
        },interval || 500)
    }
};

/*
* �켣�ط�
* initʱ��Ҫ������Ӧ��ͼ���͵����ݡ�gps���ݡ���ʱѭ���ص���ִ����ɻص�
* */
(function(tools){
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
             * maplist_source[Array]:��Ӧ��ͼ�Ĺ켣���б�
             * gpslist_source[Array]:��Ӧgps�Ĺ켣���б�
             * loop[function]:ÿ���ƶ���һ�����ִ�еĻص�
             * completed[function]:��������֮��ִ�еĻص�
             * */
            init: function (maplist_source,gpslist_source,loop,completed) {
                mapPointList = maplist_source;
                gpsFormatList = gpslist_source;
                maxCount = mapPointList.length;
                loop_callback = loop;
                completed_callback = completed;
            },
            start: function () {        //�ط�
                currentIndex = 0;
                if(timer){
                    clearTimeout(timer);
                    timer = null;
                }
                timer = setTimeout(run, 1000);
            },
            pause: function () {        //��ͣ
                clearTimeout(timer);
                timer = null;
            },
            goon: function () {         //����
                if(timer){
                    clearTimeout(timer);
                    timer = null;
                }
                timer = setTimeout(run, 1000);
            },
            restart: function () {      //����
                currentIndex = 0;
                if(timer){
                    clearTimeout(timer);
                    timer = null;
                }
                timer = setTimeout(run, 1000);
            },
            stop: function () {         //ֹͣ
                currentIndex = 0;
                maxCount = 0;
                clearTimeout(timer);
                timer = null;
            }
        }
    };
    CKMap.Tools = tools || {};
    CKMap.Tools.TrackPlayer = TrackPlayer;
})(CKMap.Tools)

