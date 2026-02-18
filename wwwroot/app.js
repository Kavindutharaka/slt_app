var app = angular.module('quizApp', []);

app.controller('MainCtrl', ['$scope', '$http', '$timeout', '$interval',
function ($scope, $http, $timeout, $interval) {

    // ---------- IMAGE MAP (category name -> filename) ----------
    var imageMap = {
        'EdgeDefend': 'EdgeDefend.png',
        'Kaspersky': 'Kaspersky.png',
        'Hostingcub': 'Hostingcub.png',
        'Akaza Cloud Fusion': 'Akaza Cloud.png',
        'CubKit': 'CubKit.png',
        'Traverse': 'Traverse.png',
        'Zoho Bigin': 'Zoho Bigin.png',
        'OrdeNow': 'OrdeNow.png',
        'Akaza Chat X': 'Akaza Chat X.png',
        'PeoBiz': 'PeoBiz.png',
        'Dataone': 'Dataone.png'
    };

    // ---------- STATE ----------
    $scope.page = 'home';
    $scope.selectedCategory = null;
    $scope.userName = '';
    $scope.userTp = '';
    $scope.showAdmin = false;
    $scope.score = 0;
    $scope.currentQIndex = 0;
    $scope.quizQuestions = [];
    $scope.timerSeconds = 10;
    $scope.timerPercent = 100;
    $scope.selectedAnswer = null;
    $scope.answerRevealed = false;

    var logoClickCount = 0;
    var logoClickTimer = null;
    var questionTimer = null;

    // ---------- CATEGORIES ----------
    $scope.categories = [
        { category: 'EdgeDefend', image: 'EdgeDefend.png', qCount: 5 },
        { category: 'Kaspersky', image: 'Kaspersky.png', qCount: 5 },
        { category: 'Hostingcub', image: 'Hostingcub.png', qCount: 5 },
        { category: 'Akaza Cloud Fusion', image: 'Akaza Cloud.png', qCount: 5 },
        { category: 'CubKit', image: 'CubKit.png', qCount: 5 },
        { category: 'Traverse', image: 'Traverse.png', qCount: 5 },
        { category: 'Zoho Bigin', image: 'Zoho Bigin.png', qCount: 5 },
        { category: 'OrdeNow', image: 'OrdeNow.png', qCount: 5 },
        { category: 'Akaza Chat X', image: 'Akaza Chat X.png', qCount: 5 },
        { category: 'PeoBiz', image: 'PeoBiz.png', qCount: 5 },
        { category: 'Dataone', image: 'Dataone.png', qCount: 5 }
    ];

    $scope.getImage = function (catName) {
        return imageMap[catName] || '';
    };

    // ---------- HOME ----------
    $scope.selectCategory = function (cat) {
        $scope.selectedCategory = cat.category;
    };

    $scope.onLogoClick = function ($event) {
        logoClickCount++;
        if (logoClickTimer) $timeout.cancel(logoClickTimer);
        logoClickTimer = $timeout(function () { logoClickCount = 0; }, 1000);
        if (logoClickCount >= 3) {
            $scope.showAdmin = true;
            logoClickCount = 0;
            loadAllSettings();
        }
    };

    $scope.closeAdmin = function ($event) {
        $scope.showAdmin = false;
    };

    // ---------- ADMIN ----------
    function loadAllSettings() {
        $scope.categories.forEach(function (cat) {
            $http.get('/api/settings/' + encodeURIComponent(cat.category))
                .then(function (res) { cat.qCount = res.data.questionCount; })
                .catch(function () { /* keep default */ });
        });
    }

    $scope.incrementQ = function (cat) {
        if (cat.qCount < 5) cat.qCount++;
    };

    $scope.decrementQ = function (cat) {
        if (cat.qCount > 1) cat.qCount--;
    };

    $scope.saveSettings = function (cat) {
        $http.post('/api/settings', {
            category: cat.category,
            questionCount: cat.qCount
        }).then(function () {
            cat.saved = true;
            $timeout(function () { cat.saved = false; }, 1500);
        });
    };

    // ---------- FORM PAGE ----------
    $scope.goToForm = function () {
        if (!$scope.selectedCategory) return;
        $scope.page = 'form';
    };

    // ---------- START QUIZ ----------
    $scope.startQuiz = function () {
        if (!$scope.userName || !$scope.userTp) return;

        var cat = $scope.categories.find(function (c) {
            return c.category === $scope.selectedCategory;
        });
        var qCount = cat ? cat.qCount : 5;

        $http.get('/api/question/' + encodeURIComponent($scope.selectedCategory))
            .then(function (res) {
                var allQ = angular.isString(res.data) ? JSON.parse(res.data) : res.data;
                $scope.quizQuestions = shuffle(allQ).slice(0, qCount);
                $scope.currentQIndex = 0;
                $scope.score = 0;
                $scope.selectedAnswer = null;
                $scope.answerRevealed = false;
                $scope.page = 'quiz';
                startTimer();
            });
    };

    // ---------- QUIZ LOGIC ----------
    function startTimer() {
        stopTimer();
        $scope.timerSeconds = 10;
        $scope.timerPercent = 100;
        $scope.selectedAnswer = null;
        $scope.answerRevealed = false;

        questionTimer = $interval(function () {
            $scope.timerSeconds--;
            $scope.timerPercent = ($scope.timerSeconds / 10) * 100;
            if ($scope.timerSeconds <= 0) {
                revealAndAdvance(null);
            }
        }, 1000);
    }

    function stopTimer() {
        if (questionTimer) {
            $interval.cancel(questionTimer);
            questionTimer = null;
        }
    }

    $scope.selectAnswer = function (key) {
        if ($scope.answerRevealed) return;
        $scope.selectedAnswer = key;
        revealAndAdvance(key);
    };

    function revealAndAdvance(key) {
        stopTimer();
        $scope.answerRevealed = true;

        if (key === $scope.quizQuestions[$scope.currentQIndex].answer) {
            $scope.score++;
        }

        $timeout(function () {
            if ($scope.currentQIndex < $scope.quizQuestions.length - 1) {
                $scope.currentQIndex++;
                startTimer();
            } else {
                showResults();
            }
        }, 1500);
    }

    // ---------- RESULTS ----------
    function showResults() {
        $scope.page = 'result';

        $http.post('/api/score', {
            userName: $scope.userName,
            tp: $scope.userTp,
            category: $scope.selectedCategory,
            score: $scope.score,
            totalQuestions: $scope.quizQuestions.length
        });

        $timeout(function () {
            window.location.reload();
        }, 6000);
    }

    // ---------- UTILS ----------
    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

}]);
