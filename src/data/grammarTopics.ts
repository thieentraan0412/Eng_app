// ============================================================
// Ngân hàng chủ điểm ngữ pháp dựng sẵn — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY.
//
// Nguồn: EngMaster_Redesign/Excel/*.xlsx (mỗi chủ điểm một sổ tính gồm 6 sheet
// ThongTin · CongThuc · CachDung · DoiChieu · Bay · CauLuyen).
// Sinh lại bằng:  node scripts/gen-grammar-topics.mjs
//
// 24 chủ điểm (A1→C1) · 738 câu luyện tập.
// Trường `key` là khóa của tiến độ học và sổ lỗi — giữ nguyên, đừng đổi.
// ============================================================
import type { GrammarTopic } from './grammar'

export const BUILTIN_TOPICS: GrammarTopic[] = [
  {
    "key": "plural-nouns",
    "builtin": true,
    "name": "Danh từ số nhiều & đếm được",
    "nameEn": "Plural and countable nouns",
    "level": "A1",
    "group": "Danh từ & mạo từ",
    "description": "Đánh dấu “nhiều hơn một” ngay trên danh từ. Tiếng Việt nói “ba quyển sách” mà chữ “sách” vẫn nguyên dạng vì số đếm đã lo phần số lượng, nên người học thấy đuôi -s là thừa và bỏ quên; ngược lại lại thêm -s vào những từ tiếng Anh không đếm được như advice hay information.",
    "icon": "layers",
    "tags": [
      "Thiếu -s số nhiều"
    ],
    "signals": [
      "many",
      "much",
      "a few",
      "a little",
      "some",
      "several",
      "a lot of",
      "how many",
      "how much",
      "a piece of"
    ],
    "formulas": [
      {
        "form": "Số nhiều thường",
        "structure": "danh từ + s",
        "example": "I bought three books at the market yesterday."
      },
      {
        "form": "Thêm -es sau s, x, ch, sh, o",
        "structure": "danh từ + es",
        "example": "She washes the dishes after dinner."
      },
      {
        "form": "Phụ âm + y ở cuối",
        "structure": "bỏ y, thêm ies",
        "example": "There are two libraries in my town."
      },
      {
        "form": "Số nhiều bất quy tắc",
        "structure": "đổi ngay trong từ, không thêm s",
        "example": "Two men and three children are waiting outside."
      },
      {
        "form": "Danh từ không đếm được",
        "structure": "giữ nguyên dạng, động từ số ít",
        "example": "This information is really useful."
      },
      {
        "form": "Đếm qua đơn vị đo",
        "structure": "số đếm + đơn vị (số nhiều) + of + danh từ",
        "example": "I drink two cups of coffee every morning."
      },
      {
        "form": "Hỏi và nói về lượng",
        "structure": "many + danh từ số nhiều, much + danh từ không đếm được",
        "example": "How many apples do we need and how much sugar?"
      }
    ],
    "uses": [
      {
        "name": "Đếm số lượng cụ thể",
        "sample": "I have three {books} and two {pens} in my bag.",
        "note": "Số đếm lớn hơn một luôn kéo theo đuôi -s trên danh từ. Tiếng Anh đánh dấu số nhiều hai lần: ở số đếm và ở danh từ."
      },
      {
        "name": "Nói chung về cả một loại",
        "sample": "{Cats} sleep a lot during the day.",
        "note": "Nói về loài mèo nói chung thì để danh từ số nhiều trần, không mạo từ. Dạng số ít cat sẽ thành một con mèo cụ thể."
      },
      {
        "name": "Số nhiều bất quy tắc",
        "sample": "Five {children} are playing with their {feet} in the water.",
        "note": "Nhóm này đổi ngay trong từ chứ không thêm -s. Phải học thuộc từng từ vì không có quy tắc chung."
      },
      {
        "name": "Danh từ không đếm được",
        "sample": "She gave me some useful {advice} about the exam.",
        "note": "advice chỉ một khối chung chung, không tách ra thành từng cái được, nên không bao giờ có -s."
      },
      {
        "name": "Đếm danh từ không đếm được qua đơn vị",
        "sample": "I drink two {cups of coffee} every morning.",
        "note": "Muốn nói số lượng thì mượn một đơn vị đếm được. Đuôi -s rơi vào cup chứ không rơi vào coffee."
      },
      {
        "name": "Hỏi về lượng",
        "sample": "How {many} students are there, and how {much} time do we have?",
        "note": "many đi với danh từ đếm được số nhiều, much đi với danh từ không đếm được. Tiếng Việt chỉ có một chữ “bao nhiêu” cho cả hai."
      },
      {
        "name": "Nói lượng nhỏ",
        "sample": "I have {a few} friends here and {a little} money left.",
        "note": "a few dùng cho cái đếm được, a little cho cái không đếm được. Chọn sai là lộ ngay việc nhầm loại danh từ."
      },
      {
        "name": "Danh từ chỉ có dạng số nhiều",
        "sample": "My {trousers} are too long and my {glasses} are dirty.",
        "note": "Những vật gồm hai phần đối xứng luôn ở dạng số nhiều, và động từ theo sau cũng chia số nhiều."
      },
      {
        "name": "Từ trông giống số nhiều nhưng không đếm được",
        "sample": "The news from home {is} very good this week.",
        "note": "news có -s nhưng vẫn là một khối không đếm được, nên động từ chia số ít."
      }
    ],
    "traps": [
      {
        "wrong": "I have three book in my bag.",
        "right": "I have three books in my bag.",
        "why": "Tiếng Việt nói “ba quyển sách”, chữ “sách” không đổi dạng vì số đếm đã cho biết là nhiều. Tiếng Anh bắt buộc đánh dấu thêm một lần nữa ngay trên danh từ."
      },
      {
        "wrong": "She gave me many advices before the interview.",
        "right": "She gave me a lot of advice before the interview.",
        "why": "Người học dịch “nhiều lời khuyên” thành many advices. advice là một khối không đếm được nên không có -s và không đi với many."
      },
      {
        "wrong": "There are many childrens in the park.",
        "right": "There are many children in the park.",
        "why": "children đã là dạng số nhiều của child rồi. Thêm -s lần nữa là đánh dấu số nhiều hai lần."
      },
      {
        "wrong": "I need some informations about the course.",
        "right": "I need some information about the course.",
        "why": "Tiếng Việt nói “vài thông tin” nghe như đếm được, nhưng information trong tiếng Anh không tách ra từng cái được."
      },
      {
        "wrong": "How much people are there in your class?",
        "right": "How many people are there in your class?",
        "why": "Chữ “bao nhiêu” của tiếng Việt dùng chung cho mọi thứ. people đếm được nên phải hỏi bằng many."
      },
      {
        "wrong": "All the furnitures in this room are new.",
        "right": "All the furniture in this room is new.",
        "why": "furniture là tên gọi chung của cả nhóm đồ đạc nên không có -s, và động từ theo sau chia số ít."
      },
      {
        "wrong": "My money are in the top drawer.",
        "right": "My money is in the top drawer.",
        "why": "Tiếng Việt hiểu tiền là nhiều tờ nên người học chia động từ số nhiều. money không đếm được, luôn đi với động từ số ít."
      }
    ],
    "compare": {
      "with": "Danh từ không đếm được",
      "rows": [
        {
          "key": "Thêm được đuôi -s không",
          "other": "Không — luôn giữ nguyên một dạng duy nhất",
          "self": "Có — thêm -s hoặc -es khi từ hai trở lên"
        },
        {
          "key": "Từ chỉ lượng đi kèm",
          "other": "much, a little, a bit of, a lot of",
          "self": "many, a few, several, a number of, a lot of"
        },
        {
          "key": "Mạo từ a hoặc an",
          "other": "Không dùng, phải mượn đơn vị: a piece of advice",
          "self": "Dùng bình thường khi số ít: a book, an apple"
        },
        {
          "key": "Động từ đi kèm",
          "other": "Luôn số ít: The furniture is new.",
          "self": "Chia theo số: The books are new."
        },
        {
          "key": "Ví dụ đối chiếu",
          "other": "I need some information about the course.",
          "self": "I need three documents for the course."
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Thêm -s vào advice, information, furniture, homework",
          "self": "Quên -s vì tiếng Việt để danh từ nguyên dạng sau số đếm"
        }
      ]
    },
    "items": [
      {
        "id": "plural-nouns-1",
        "kind": "cloze",
        "prompt": "I bought three ___ at the market yesterday. ",
        "answers": [
          "books"
        ],
        "cue": "book",
        "explain": "Sau số đếm lớn hơn một, danh từ đếm được phải mang đuôi -s.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-2",
        "kind": "cloze",
        "prompt": "She washes the ___ every evening after dinner. ",
        "answers": [
          "dishes"
        ],
        "cue": "dish",
        "explain": "Danh từ tận cùng bằng -sh nhận đuôi -es cho dễ đọc.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-3",
        "kind": "mcq",
        "prompt": "There are two ___ near my house.",
        "answers": [
          "libraries"
        ],
        "options": [
          "libraries",
          "librarys",
          "library",
          "libraryes"
        ],
        "explain": "Phụ âm đứng trước y thì đổi y thành i rồi thêm -es.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-4",
        "kind": "correct",
        "prompt": "My brother keeps five box of old toys under his bed.",
        "answers": [
          "boxes"
        ],
        "tokens": [
          "My",
          "brother",
          "keeps",
          "five",
          "box",
          "of",
          "old",
          "toys",
          "under",
          "his",
          "bed."
        ],
        "errIndex": 4,
        "explain": "Danh từ tận cùng bằng -x lấy đuôi -es chứ không chỉ -s.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-5",
        "kind": "mcq",
        "prompt": "I need a few ___ for the salad.",
        "answers": [
          "tomatoes"
        ],
        "options": [
          "tomatoes",
          "tomatos",
          "tomato",
          "tomatoies"
        ],
        "explain": "Danh từ tận cùng bằng -o chỉ đồ ăn quen thuộc lấy đuôi -es.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-6",
        "kind": "cloze",
        "prompt": "Two ___ are waiting at the reception desk. ",
        "answers": [
          "men"
        ],
        "cue": "man",
        "explain": "man đổi nguyên âm bên trong thành men, không nhận thêm -s.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-7",
        "kind": "cloze",
        "prompt": "The ___ are playing in the garden. ",
        "answers": [
          "children"
        ],
        "cue": "child",
        "explain": "child có dạng số nhiều riêng, phải nhớ chứ không suy ra được.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-8",
        "kind": "mcq",
        "prompt": "My ___ hurt after the long walk.",
        "answers": [
          "feet"
        ],
        "options": [
          "feet",
          "foots",
          "feets",
          "foot"
        ],
        "explain": "foot thuộc nhóm đổi nguyên âm, còn feets là đánh dấu số nhiều tới hai lần.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-9",
        "kind": "correct",
        "prompt": "Three womans joined the meeting this morning.",
        "answers": [
          "women"
        ],
        "tokens": [
          "Three",
          "womans",
          "joined",
          "the",
          "meeting",
          "this",
          "morning."
        ],
        "errIndex": 1,
        "explain": "woman có dạng số nhiều riêng nên không nhận đuôi -s.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-10",
        "kind": "correct",
        "prompt": "I brush my tooths twice a day.",
        "answers": [
          "teeth"
        ],
        "tokens": [
          "I",
          "brush",
          "my",
          "tooths",
          "twice",
          "a",
          "day."
        ],
        "errIndex": 3,
        "explain": "tooth đổi thành teeth, đây là dạng cố định phải học thuộc.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-11",
        "kind": "mcq",
        "prompt": "There were a lot of ___ at the concert.",
        "answers": [
          "people"
        ],
        "options": [
          "people",
          "peoples",
          "person"
        ],
        "explain": "people đã là dạng số nhiều của person nên không thêm gì nữa.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-12",
        "kind": "cloze",
        "prompt": "She gave me a lot of useful ___ about the course. ",
        "answers": [
          "information"
        ],
        "cue": "information",
        "explain": "Dù lượng nhiều đến đâu, information vẫn giữ nguyên một dạng.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-13",
        "kind": "mcq",
        "prompt": "He gave me some good ___ before the interview.",
        "answers": [
          "advice"
        ],
        "options": [
          "advice",
          "advices",
          "an advice"
        ],
        "explain": "advice là một khối không tách rời nên không có -s và không đi với a.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-14",
        "kind": "correct",
        "prompt": "We bought new furnitures for the living room.",
        "answers": [
          "furniture"
        ],
        "tokens": [
          "We",
          "bought",
          "new",
          "furnitures",
          "for",
          "the",
          "living",
          "room."
        ],
        "errIndex": 3,
        "explain": "furniture là tên gọi chung của cả nhóm đồ đạc, luôn ở một dạng.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-15",
        "kind": "cloze",
        "prompt": "The news from home ___ very good this week. ",
        "answers": [
          "is"
        ],
        "cue": "be",
        "explain": "news có -s nhưng vẫn không đếm được nên động từ chia số ít.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-16",
        "kind": "mcq",
        "prompt": "I have a lot of ___ tonight.",
        "answers": [
          "homework"
        ],
        "options": [
          "homework",
          "homeworks",
          "homeworkes"
        ],
        "explain": "Muốn nói số lượng bài thì phải mượn đơn vị: two pieces of homework.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-17",
        "kind": "correct",
        "prompt": "All my luggages is still at the airport.",
        "answers": [
          "luggage"
        ],
        "tokens": [
          "All",
          "my",
          "luggages",
          "is",
          "still",
          "at",
          "the",
          "airport."
        ],
        "errIndex": 2,
        "explain": "luggage gọi chung cả đống hành lý; muốn đếm thì nói bags hoặc suitcases.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-18",
        "kind": "mcq",
        "prompt": "How ___ eggs do we need for this cake?",
        "answers": [
          "many"
        ],
        "options": [
          "many",
          "much",
          "a lot of"
        ],
        "explain": "eggs đếm được nên hỏi bằng many, còn much dành cho thứ không đếm được.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-19",
        "kind": "cloze",
        "prompt": "How ___ sugar do you take in your coffee?",
        "answers": [
          "much"
        ],
        "explain": "sugar là một khối không tách ra được nên hỏi lượng bằng much.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-20",
        "kind": "mcq",
        "prompt": "I have ___ close friends in this city.",
        "answers": [
          "a few"
        ],
        "options": [
          "a few",
          "a little",
          "much"
        ],
        "explain": "friends đếm được nên đi với a few; a little dành cho thứ không đếm được.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-21",
        "kind": "cloze",
        "prompt": "There is only ___ milk left in the fridge.",
        "answers": [
          "a little"
        ],
        "explain": "milk không đếm được, nên lượng ít được nói bằng a little.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-22",
        "kind": "correct",
        "prompt": "There are much cars on the road this morning.",
        "answers": [
          "many"
        ],
        "tokens": [
          "There",
          "are",
          "much",
          "cars",
          "on",
          "the",
          "road",
          "this",
          "morning."
        ],
        "errIndex": 2,
        "explain": "cars đếm được, và động từ are cũng đã báo hiệu đây là danh từ số nhiều.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-23",
        "kind": "correct",
        "prompt": "She does not have many free time at the weekend.",
        "answers": [
          "much"
        ],
        "tokens": [
          "She",
          "does",
          "not",
          "have",
          "many",
          "free",
          "time",
          "at",
          "the",
          "weekend."
        ],
        "errIndex": 4,
        "explain": "time ở đây là khoảng thời gian nói chung nên không đếm được.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-24",
        "kind": "cloze",
        "prompt": "I drink two ___ of coffee every morning. ",
        "answers": [
          "cups"
        ],
        "cue": "cup",
        "explain": "Đuôi -s rơi vào đơn vị đo, còn coffee vẫn giữ nguyên.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-25",
        "kind": "mcq",
        "prompt": "He ate three ___ for breakfast.",
        "answers": [
          "slices of bread"
        ],
        "options": [
          "slices of bread",
          "breads",
          "slice of breads"
        ],
        "explain": "bread không đếm được nên phải đếm qua đơn vị slice.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-26",
        "kind": "correct",
        "prompt": "She bought two kilo of rice at the market.",
        "answers": [
          "kilos"
        ],
        "tokens": [
          "She",
          "bought",
          "two",
          "kilo",
          "of",
          "rice",
          "at",
          "the",
          "market."
        ],
        "errIndex": 3,
        "explain": "Đơn vị đo là danh từ đếm được nên có -s, còn rice thì không.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-27",
        "kind": "transform",
        "prompt": "There is one child in the room.",
        "answers": [
          "There are four children in the room."
        ],
        "explain": "Đổi sang số nhiều thì cả danh từ lẫn động từ is đều phải đổi theo.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-28",
        "kind": "transform",
        "prompt": "We need to buy some bread.",
        "answers": [
          "We need to buy two loaves of bread."
        ],
        "explain": "Muốn nói số lượng của một thứ không đếm được thì phải mượn đơn vị.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-29",
        "kind": "transform",
        "prompt": "She has a lot of homework tonight.",
        "answers": [
          "She has three pieces of homework tonight."
        ],
        "explain": "piece là đơn vị đếm được nên nhận -s, homework thì giữ nguyên.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-30",
        "kind": "transform",
        "prompt": "There is not much water in the bottle.",
        "answers": [
          "There is only a little water in the bottle."
        ],
        "explain": "much và a little cùng đi với danh từ không đếm được, chỉ khác sắc thái.",
        "errorTag": "Thiếu -s số nhiều"
      },
      {
        "id": "plural-nouns-31",
        "kind": "transform",
        "prompt": "I know a small number of people here.",
        "answers": [
          "I know a few people here."
        ],
        "explain": "a few thay cho cụm chỉ số lượng nhỏ của danh từ đếm được.",
        "errorTag": "Thiếu -s số nhiều"
      }
    ]
  },
  {
    "key": "articles",
    "builtin": true,
    "name": "Mạo từ a / an / the / Ø",
    "nameEn": "Articles",
    "level": "A1",
    "group": "Danh từ & mạo từ",
    "description": "Cho người nghe biết danh từ đang nhắc tới là một cái bất kỳ hay đúng cái mà cả hai đã biết. Tiếng Việt không có lớp từ này nên người học thường bỏ trắng, hoặc dịch “một” thành a và “cái đó” thành the rồi đặt sai chỗ.",
    "icon": "type",
    "tags": [
      "Thiếu mạo từ"
    ],
    "signals": [
      "a",
      "an",
      "the",
      "the first",
      "the same",
      "the only",
      "the best",
      "one of the",
      "in the world",
      "go to school"
    ],
    "formulas": [
      {
        "form": "Bất định trước âm phụ âm",
        "structure": "a + danh từ đếm được số ít",
        "example": "She works in a hospital near my house."
      },
      {
        "form": "Bất định trước âm nguyên âm",
        "structure": "an + danh từ đếm được số ít",
        "example": "I waited for an hour at the station."
      },
      {
        "form": "Xác định",
        "structure": "the + danh từ số ít, số nhiều hoặc không đếm được",
        "example": "The book you lent me was excellent."
      },
      {
        "form": "Vật duy nhất, so sánh nhất, số thứ tự",
        "structure": "the + sun, the best, the first",
        "example": "This is the best coffee in the city."
      },
      {
        "form": "Không mạo từ khi nói chung",
        "structure": "Ø + danh từ số nhiều hoặc không đếm được",
        "example": "Children love chocolate."
      },
      {
        "form": "Không mạo từ với bữa ăn, môn học, tên riêng",
        "structure": "Ø + breakfast, English, Ha Noi",
        "example": "We have breakfast at seven and study English at eight."
      },
      {
        "form": "Cụm cố định chỉ mục đích",
        "structure": "go to school, go to bed, go to work",
        "example": "My son goes to school by bus."
      }
    ],
    "uses": [
      {
        "name": "Lần đầu nhắc tới một vật",
        "sample": "I saw {a} dog in the park this morning.",
        "note": "Người nghe chưa biết con chó nào nên chỉ giới thiệu bằng a. Danh từ đếm được số ít không bao giờ đứng trơ một mình."
      },
      {
        "name": "Nhắc lại vật đã nêu",
        "sample": "I saw a dog in the park. {The} dog was chasing a cat.",
        "note": "Đến lần thứ hai thì cả hai bên cùng biết đang nói con nào, nên chuyển sang the."
      },
      {
        "name": "Chọn a hay an theo âm, không theo chữ",
        "sample": "She waited for {an} hour outside {a} university.",
        "note": "hour có h câm nên đọc mở đầu bằng nguyên âm. university đọc là “diu” nên mở đầu bằng phụ âm."
      },
      {
        "name": "Vật chỉ có một trên đời",
        "sample": "{The} moon looks very bright tonight.",
        "note": "Chỉ có một mặt trăng nên không thể hiểu nhầm sang cái nào khác, mặc định dùng the."
      },
      {
        "name": "So sánh nhất và số thứ tự",
        "sample": "This is {the} best restaurant on {the} first floor.",
        "note": "Cái nhất và cái thứ mấy đều là duy nhất trong nhóm đang xét, nên luôn kèm the."
      },
      {
        "name": "Nói chung về cả một loại",
        "sample": "{Dogs} are very loyal animals.",
        "note": "Nói về loài chó nói chung thì để danh từ số nhiều trần. Thêm the là đang chỉ mấy con chó cụ thể nào đó."
      },
      {
        "name": "Bữa ăn, môn học, tên riêng",
        "sample": "We have {breakfast} at seven and then study {English}.",
        "note": "Nhóm này mặc định không mạo từ. Thêm the vào là câu nghe lạ ngay với người bản ngữ."
      },
      {
        "name": "Nghề nghiệp",
        "sample": "My sister is {a} nurse at the city hospital.",
        "note": "Tiếng Việt nói “cô ấy là y tá” không cần từ nào thêm, nhưng tiếng Anh bắt buộc có a trước nghề nghiệp số ít."
      },
      {
        "name": "Mục đích khác với địa điểm",
        "sample": "My son goes to {school} by bus, but today I drove to {the school} to meet his teacher.",
        "note": "Không mạo từ khi nói về việc đi học. Có the khi nói về chính toà nhà đó."
      }
    ],
    "traps": [
      {
        "wrong": "She is nurse at a big hospital.",
        "right": "She is a nurse at a big hospital.",
        "why": "Tiếng Việt nói “cô ấy là y tá” không có từ nào tương ứng với a nên người học bỏ trắng. Nghề nghiệp số ít trong tiếng Anh luôn cần a hoặc an."
      },
      {
        "wrong": "I waited for a hour at the airport.",
        "right": "I waited for an hour at the airport.",
        "why": "Chọn a hay an nghe theo âm đầu chứ không nhìn chữ cái. h trong hour là âm câm nên từ này mở đầu bằng nguyên âm."
      },
      {
        "wrong": "He is an university student.",
        "right": "He is a university student.",
        "why": "Chữ u ở đây đọc là “diu”, tức mở đầu bằng phụ âm. Nhìn mặt chữ mà chọn an là mắc bẫy."
      },
      {
        "wrong": "The dogs are friendly animals.",
        "right": "Dogs are friendly animals.",
        "why": "Nói chung về cả loài thì để danh từ số nhiều trần. Thêm the là câu chuyển thành “mấy con chó kia”, không còn là nhận xét chung."
      },
      {
        "wrong": "My son goes to the school every morning.",
        "right": "My son goes to school every morning.",
        "why": "go to school nói về việc đi học nên không mạo từ. Có the là đang nói tới toà nhà cụ thể, chẳng hạn khi phụ huynh tới gặp giáo viên."
      },
      {
        "wrong": "I bought a new phone. A phone is very light.",
        "right": "I bought a new phone. The phone is very light.",
        "why": "Nhắc lần thứ hai thì hai bên đã cùng biết vật nào, phải chuyển sang the. Giữ nguyên a là như đang nói tới một chiếc điện thoại khác."
      },
      {
        "wrong": "She is the best student in a class.",
        "right": "She is the best student in the class.",
        "why": "So sánh nhất luôn kèm the, và nhóm được so sánh cũng là nhóm xác định mà cả hai bên đều biết."
      }
    ],
    "compare": {
      "with": "Không dùng mạo từ (Ø)",
      "rows": [
        {
          "key": "Khi nào dùng",
          "other": "Nói chung về cả loại, hoặc về một chất, một khái niệm",
          "self": "Nói về một cá thể cụ thể, mới nhắc hoặc đã xác định"
        },
        {
          "key": "Danh từ đi kèm",
          "other": "Số nhiều hoặc không đếm được: books, water",
          "self": "Số ít bất kỳ: a book; đã xác định: the book, the water"
        },
        {
          "key": "Nhóm từ hay gặp",
          "other": "Bữa ăn, môn học, tên người, tên thành phố, tên nước",
          "self": "Vật duy nhất, so sánh nhất, số thứ tự, nghề nghiệp"
        },
        {
          "key": "Ví dụ đối chiếu",
          "other": "I like coffee in the morning.",
          "self": "The coffee in this shop is excellent."
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Thêm the vào câu nói chung, kiểu The dogs are friendly",
          "self": "Bỏ trắng vì tiếng Việt không có mạo từ, kiểu She is nurse"
        }
      ]
    },
    "items": [
      {
        "id": "articles-1",
        "kind": "cloze",
        "prompt": "My father is ___ teacher at a primary school.",
        "answers": [
          "a"
        ],
        "explain": "Nghề nghiệp số ít bắt buộc có mạo từ, và teacher mở đầu bằng âm phụ âm.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-2",
        "kind": "cloze",
        "prompt": "We waited for ___ hour outside the station.",
        "answers": [
          "an"
        ],
        "explain": "h trong hour là âm câm nên từ này mở đầu bằng âm nguyên âm.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-3",
        "kind": "cloze",
        "prompt": "He works as ___ engineer for a Japanese company.",
        "answers": [
          "an"
        ],
        "explain": "engineer mở đầu bằng âm e nên đi với an.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-4",
        "kind": "mcq",
        "prompt": "She is studying at ___ university in Australia.",
        "answers": [
          "a"
        ],
        "options": [
          "a",
          "an",
          "the"
        ],
        "explain": "university đọc mở đầu bằng âm phụ âm dù chữ cái đầu là nguyên âm.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-5",
        "kind": "mcq",
        "prompt": "He has ___ MBA from a business school in Singapore.",
        "answers": [
          "an"
        ],
        "options": [
          "an",
          "a",
          "the"
        ],
        "explain": "Chữ M đọc là “em” nên nghe như mở đầu bằng nguyên âm.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-6",
        "kind": "correct",
        "prompt": "It takes me a hour to get to work every morning.",
        "answers": [
          "an"
        ],
        "tokens": [
          "It",
          "takes",
          "me",
          "a",
          "hour",
          "to",
          "get",
          "to",
          "work",
          "every",
          "morning."
        ],
        "errIndex": 3,
        "explain": "Chọn mạo từ theo âm đầu khi đọc lên, không theo mặt chữ.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-7",
        "kind": "cloze",
        "prompt": "I saw a cat in our garden. ___ cat was sleeping under a tree.",
        "answers": [
          "The"
        ],
        "explain": "Con mèo đã được nhắc ở câu trước nên cả hai bên đều biết đang nói con nào.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-8",
        "kind": "mcq",
        "prompt": "There is a small café near my house. ___ café opens at six.",
        "answers": [
          "The"
        ],
        "options": [
          "The",
          "A",
          "An"
        ],
        "explain": "Câu thứ hai nhắc lại đúng quán vừa nêu nên chuyển sang the.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-9",
        "kind": "correct",
        "prompt": "I read a book last week and a book was really funny.",
        "answers": [
          "the"
        ],
        "tokens": [
          "I",
          "read",
          "a",
          "book",
          "last",
          "week",
          "and",
          "a",
          "book",
          "was",
          "really",
          "funny."
        ],
        "errIndex": 7,
        "explain": "Lần nhắc thứ hai phải là the, nếu không người nghe tưởng là cuốn khác.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-10",
        "kind": "cloze",
        "prompt": "Could you pass me ___ salt, please?",
        "answers": [
          "the"
        ],
        "explain": "Lọ muối đang trên bàn trước mặt hai người nên đã là vật xác định.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-11",
        "kind": "mcq",
        "prompt": "I need ___ pen. Can you lend me one?",
        "answers": [
          "a"
        ],
        "options": [
          "a",
          "an",
          "the"
        ],
        "explain": "Bút nào cũng được, người nghe chưa biết cây nào, nên dùng a.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-12",
        "kind": "cloze",
        "prompt": "___ sun rises in the east every morning.",
        "answers": [
          "The"
        ],
        "explain": "Chỉ có một mặt trời nên không cần phân biệt với cái nào khác.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-13",
        "kind": "mcq",
        "prompt": "This is ___ best pho in Ha Noi.",
        "answers": [
          "the"
        ],
        "options": [
          "the",
          "a",
          "an"
        ],
        "explain": "So sánh nhất chỉ ra một cái duy nhất trong nhóm nên luôn kèm the.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-14",
        "kind": "correct",
        "prompt": "She lives on a second floor of that building.",
        "answers": [
          "the"
        ],
        "tokens": [
          "She",
          "lives",
          "on",
          "a",
          "second",
          "floor",
          "of",
          "that",
          "building."
        ],
        "errIndex": 3,
        "explain": "Số thứ tự xác định đúng một tầng trong toà nhà đó.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-15",
        "kind": "cloze",
        "prompt": "Fansipan is ___ highest mountain in Viet Nam.",
        "answers": [
          "the"
        ],
        "explain": "Ngọn cao nhất chỉ có một, nên đi với the như mọi so sánh nhất.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-16",
        "kind": "mcq",
        "prompt": "We are going to ___ cinema tonight.",
        "answers": [
          "the"
        ],
        "options": [
          "the",
          "a",
          "an"
        ],
        "explain": "go to the cinema là cụm quen dùng, chỉ hoạt động đi xem phim.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-17",
        "kind": "cloze",
        "prompt": "___ are very loyal animals.",
        "answers": [
          "Dogs"
        ],
        "explain": "Nhận xét chung về cả loài thì để danh từ số nhiều trần.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-18",
        "kind": "cloze",
        "prompt": "I never drink ___ after six o'clock.",
        "answers": [
          "coffee"
        ],
        "explain": "Nói về cà phê nói chung, không phải chỗ cà phê cụ thể nào.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-19",
        "kind": "mcq",
        "prompt": "___ water in this bottle tastes strange.",
        "answers": [
          "The"
        ],
        "options": [
          "The",
          "A",
          "An"
        ],
        "explain": "Cụm in this bottle đã chỉ đúng chỗ nước nào, nên là vật xác định.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-20",
        "kind": "cloze",
        "prompt": "___ students in my class come from five different countries.",
        "answers": [
          "The"
        ],
        "explain": "Cụm in my class giới hạn lại đúng nhóm học sinh đang nói tới.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-21",
        "kind": "cloze",
        "prompt": "My mother teaches ___ at a high school.",
        "answers": [
          "English"
        ],
        "explain": "Tên môn học đứng trần, không kèm mạo từ.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-22",
        "kind": "cloze",
        "prompt": "We usually have ___ at half past six.",
        "answers": [
          "breakfast"
        ],
        "explain": "Tên bữa ăn thuộc nhóm mặc định không mạo từ.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-23",
        "kind": "cloze",
        "prompt": "They moved to ___ two years ago.",
        "answers": [
          "Ha Noi"
        ],
        "explain": "Tên thành phố đã đủ xác định nên không cần the đứng trước.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-24",
        "kind": "mcq",
        "prompt": "Yesterday my father drove to ___ school to meet my teacher.",
        "answers": [
          "the"
        ],
        "options": [
          "the",
          "a",
          "an"
        ],
        "explain": "Ở đây nói về chính toà nhà cụ thể chứ không phải việc đi học.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-25",
        "kind": "cloze",
        "prompt": "After dinner we watched ___ film you recommended.",
        "answers": [
          "the"
        ],
        "explain": "Mệnh đề you recommended đã chỉ rõ bộ phim nào.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-26",
        "kind": "transform",
        "prompt": "There is a new café near my house. It opens at six.",
        "answers": [
          "There is a new café near my house and the café opens at six."
        ],
        "explain": "Khi gộp lại, lần nhắc thứ hai chuyển từ a sang the.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-27",
        "kind": "transform",
        "prompt": "This restaurant is better than all the others in town.",
        "answers": [
          "This is the best restaurant in town."
        ],
        "explain": "Chuyển sang so sánh nhất thì phải kèm the.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-28",
        "kind": "transform",
        "prompt": "I do not like coffee that is too strong.",
        "answers": [
          "I do not like strong coffee."
        ],
        "explain": "Nói chung về một loại đồ uống thì danh từ không đếm được đứng trần.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-29",
        "kind": "transform",
        "prompt": "He goes to the school building every day to study.",
        "answers": [
          "He goes to school every day."
        ],
        "explain": "Nói về việc đi học thì dùng cụm cố định go to school, bỏ the.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "articles-30",
        "kind": "transform",
        "prompt": "It takes sixty minutes to get there.",
        "answers": [
          "It takes an hour to get there."
        ],
        "explain": "hour đọc mở đầu bằng nguyên âm nên lấy an chứ không lấy a.",
        "errorTag": "Thiếu mạo từ"
      }
    ]
  },
  {
    "key": "present-simple",
    "builtin": true,
    "name": "Hiện tại đơn & tiếp diễn",
    "nameEn": "Present simple and continuous",
    "level": "A1",
    "group": "Thì động từ",
    "description": "Hiện tại đơn nói về thói quen và sự thật, hiện tại tiếp diễn nói về việc đang diễn ra lúc này. Động từ tiếng Việt không đổi dạng theo ngôi nên người học hay quên -s ở he, she, it; và vì chữ “đang” gắn được vào mọi động từ nên họ cũng đưa cả know, like, want vào dạng tiếp diễn.",
    "icon": "clock",
    "tags": [
      "Thiếu -s ngôi 3",
      "Thiếu to be"
    ],
    "signals": [
      "always",
      "usually",
      "often",
      "sometimes",
      "never",
      "every day",
      "now",
      "at the moment",
      "right now",
      "look"
    ],
    "formulas": [
      {
        "form": "Hiện tại đơn — khẳng định",
        "structure": "S + V, thêm s hoặc es với he, she, it",
        "example": "She works in a bank near the market."
      },
      {
        "form": "Hiện tại đơn — phủ định",
        "structure": "S + do hoặc does + not + V nguyên thể",
        "example": "He does not eat meat."
      },
      {
        "form": "Hiện tại đơn — câu hỏi",
        "structure": "Do hoặc Does + S + V nguyên thể",
        "example": "Does your sister live in Ha Noi?"
      },
      {
        "form": "Hiện tại tiếp diễn — khẳng định",
        "structure": "S + am, is hoặc are + V-ing",
        "example": "They are waiting for the bus now."
      },
      {
        "form": "Hiện tại tiếp diễn — phủ định",
        "structure": "S + am, is hoặc are + not + V-ing",
        "example": "I am not working today."
      },
      {
        "form": "Hiện tại tiếp diễn — câu hỏi",
        "structure": "Am, Is hoặc Are + S + V-ing",
        "example": "Are you listening to me?"
      },
      {
        "form": "Tiếp diễn cho kế hoạch đã hẹn",
        "structure": "S + am, is hoặc are + V-ing + mốc thời gian",
        "example": "We are meeting the client at ten tomorrow."
      }
    ],
    "uses": [
      {
        "name": "Thói quen lặp lại đều đặn",
        "sample": "She {gets} up at six every morning.",
        "note": "Việc lặp đi lặp lại thì dùng hiện tại đơn. Chủ ngữ she nên động từ mang đuôi -s."
      },
      {
        "name": "Sự thật luôn đúng",
        "sample": "Water {boils} at one hundred degrees.",
        "note": "Quy luật không phụ thuộc thời điểm nói nên luôn ở hiện tại đơn."
      },
      {
        "name": "Câu hỏi và phủ định hiện tại đơn",
        "sample": "{Does} your brother {work} in Da Nang?",
        "note": "Động từ thường phải mượn do hoặc does. Khi đã có does thì động từ chính quay về nguyên thể."
      },
      {
        "name": "Việc đang xảy ra ngay lúc nói",
        "sample": "The children {are playing} in the garden right now.",
        "note": "Hành động bắt đầu rồi và chưa kết thúc, nên cần am, is hoặc are đi cùng V-ing."
      },
      {
        "name": "Việc tạm thời trong giai đoạn này",
        "sample": "I {am staying} with my aunt this month.",
        "note": "Không phải thói quen lâu dài, chỉ kéo dài một thời gian rồi thôi."
      },
      {
        "name": "Trạng từ tần suất và vị trí của nó",
        "sample": "He {usually} takes the bus, and he is {never} late.",
        "note": "Trạng từ tần suất đứng trước động từ thường nhưng đứng sau to be. Đây là vị trí cố định, không đổi được."
      },
      {
        "name": "Động từ trạng thái không chia tiếp diễn",
        "sample": "I {know} the answer and I {want} to help you.",
        "note": "know và want mô tả trạng thái trong đầu, không phải việc đang làm, nên không có dạng V-ing."
      },
      {
        "name": "Phàn nàn với always",
        "sample": "He is {always losing} his keys.",
        "note": "Tiếp diễn kèm always mang sắc thái khó chịu về việc lặp lại quá nhiều lần."
      },
      {
        "name": "Kế hoạch đã hẹn chắc chắn",
        "sample": "We {are meeting} the client at ten tomorrow.",
        "note": "Đã chốt giờ và có hẹn với người khác nên dùng tiếp diễn cho việc sắp tới."
      }
    ],
    "traps": [
      {
        "wrong": "She work in a hospital near my house.",
        "right": "She works in a hospital near my house.",
        "why": "Tiếng Việt nói “cô ấy làm việc”, động từ giữ nguyên với mọi chủ ngữ. Trong tiếng Anh, he, she, it kéo theo đuôi -s và người học thường quên mất."
      },
      {
        "wrong": "He doesn't works on Sunday.",
        "right": "He does not work on Sunday.",
        "why": "Đuôi -s đã nằm ở does rồi. Đánh dấu ngôi thứ ba hai lần là thừa, động từ chính phải về nguyên thể."
      },
      {
        "wrong": "Do she like coffee?",
        "right": "Does she like coffee?",
        "why": "Trợ động từ mới là chỗ mang dấu hiệu ngôi. Chủ ngữ she thì phải là Does chứ không phải Do."
      },
      {
        "wrong": "She working in the kitchen now.",
        "right": "She is working in the kitchen now.",
        "why": "Tiếng Việt nói “cô ấy đang nấu ăn” không cần từ nối nào. Tiếng Anh bắt buộc có is đứng giữa, thiếu nó là câu chưa có động từ chính."
      },
      {
        "wrong": "I am knowing the answer.",
        "right": "I know the answer.",
        "why": "Chữ “đang” trong tiếng Việt gắn được vào mọi động từ. know nói về trạng thái nên tiếng Anh không cho nó vào dạng tiếp diễn."
      },
      {
        "wrong": "She is having two cars and a small house.",
        "right": "She has two cars and a small house.",
        "why": "have mang nghĩa sở hữu là một trạng thái, không phải việc đang làm, nên giữ ở hiện tại đơn."
      },
      {
        "wrong": "He goes always to the gym after work.",
        "right": "He always goes to the gym after work.",
        "why": "Tiếng Việt đặt “luôn luôn” khá tự do trong câu. Tiếng Anh giữ trạng từ tần suất ở đúng khe giữa chủ ngữ và động từ thường."
      }
    ],
    "compare": {
      "with": "Hiện tại đơn",
      "rows": [
        {
          "key": "Nói về cái gì",
          "other": "Thói quen, sự thật, lịch cố định",
          "self": "Việc đang diễn ra lúc nói hoặc trong giai đoạn này"
        },
        {
          "key": "Dạng động từ",
          "other": "V nguyên thể, thêm s hoặc es với he, she, it",
          "self": "am, is hoặc are cộng với V-ing"
        },
        {
          "key": "Câu hỏi và phủ định",
          "other": "Mượn do hoặc does, động từ chính về nguyên thể",
          "self": "Đảo chính am, is, are; không mượn do"
        },
        {
          "key": "Từ tín hiệu",
          "other": "every day, usually, often, never, on Mondays",
          "self": "now, at the moment, today, look, listen"
        },
        {
          "key": "Động từ trạng thái",
          "other": "Dùng bình thường: I know, She likes",
          "self": "Không dùng: I am knowing là câu sai"
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Quên -s ở he, she, it vì tiếng Việt không chia động từ",
          "self": "Bê chữ “đang” vào know, like, want và bỏ mất am, is, are"
        }
      ]
    },
    "items": [
      {
        "id": "present-simple-1",
        "kind": "cloze",
        "prompt": "My sister ___ in a small bookshop. ",
        "answers": [
          "works"
        ],
        "cue": "work",
        "explain": "Chủ ngữ she nên động từ phải mang đuôi -s.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-2",
        "kind": "cloze",
        "prompt": "He ___ the news every evening. ",
        "answers": [
          "watches"
        ],
        "cue": "watch",
        "explain": "Động từ tận cùng bằng -ch nhận đuôi -es cho dễ đọc.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-3",
        "kind": "mcq",
        "prompt": "My brother ___ English every morning.",
        "answers": [
          "studies"
        ],
        "options": [
          "studies",
          "study",
          "studys",
          "studing"
        ],
        "explain": "Phụ âm đứng trước y thì đổi y thành i rồi thêm -es.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-4",
        "kind": "correct",
        "prompt": "She go to the gym three times a week.",
        "answers": [
          "goes"
        ],
        "tokens": [
          "She",
          "go",
          "to",
          "the",
          "gym",
          "three",
          "times",
          "a",
          "week."
        ],
        "errIndex": 1,
        "explain": "Chủ ngữ she kéo theo đuôi -es dù tiếng Việt để động từ nguyên dạng.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-5",
        "kind": "mcq",
        "prompt": "My parents ___ in Hue.",
        "answers": [
          "live"
        ],
        "options": [
          "live",
          "lives",
          "living"
        ],
        "explain": "Chủ ngữ số nhiều thì động từ không thêm gì cả.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-6",
        "kind": "cloze",
        "prompt": "___ your brother work at the hospital?",
        "answers": [
          "Does"
        ],
        "explain": "Chủ ngữ ngôi thứ ba số ít nên trợ động từ là does.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-7",
        "kind": "cloze",
        "prompt": "He ___ at weekends.",
        "answers": [
          "does not work"
        ],
        "explain": "Dấu hiệu ngôi đã nằm ở does, động từ chính quay về nguyên thể.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-8",
        "kind": "mcq",
        "prompt": "___ you like Vietnamese coffee?",
        "answers": [
          "Do"
        ],
        "options": [
          "Do",
          "Does",
          "Are"
        ],
        "explain": "Chủ ngữ you đi với do, và like là động từ thường nên không mượn to be.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-9",
        "kind": "cloze",
        "prompt": "She ___ like spicy food at all.",
        "answers": [
          "does not"
        ],
        "explain": "Chủ ngữ she nên phủ định mượn does, còn like giữ nguyên thể.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-10",
        "kind": "correct",
        "prompt": "Do your sister work in Ha Noi?",
        "answers": [
          "Does"
        ],
        "tokens": [
          "Do",
          "your",
          "sister",
          "work",
          "in",
          "Ha",
          "Noi?"
        ],
        "errIndex": 0,
        "explain": "Chủ ngữ là một người, thuộc ngôi thứ ba số ít.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-11",
        "kind": "cloze",
        "prompt": "Look, the baby ___ now. ",
        "answers": [
          "is sleeping"
        ],
        "cue": "sleep",
        "explain": "Việc đang diễn ra ngay lúc nói nên cần is đi cùng đuôi -ing.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-12",
        "kind": "cloze",
        "prompt": "The children ___ in the yard at the moment. ",
        "answers": [
          "are playing"
        ],
        "cue": "play",
        "explain": "Chủ ngữ số nhiều đi với are chứ không phải is.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-13",
        "kind": "correct",
        "prompt": "She working in the kitchen right now.",
        "answers": [
          "is working"
        ],
        "tokens": [
          "She",
          "working",
          "in",
          "the",
          "kitchen",
          "right",
          "now."
        ],
        "errIndex": 1,
        "explain": "Tiếng Việt nói “đang nấu” không cần từ nối, tiếng Anh bắt buộc có is.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-14",
        "kind": "mcq",
        "prompt": "I ___ an email right now.",
        "answers": [
          "am writing"
        ],
        "options": [
          "am writing",
          "writing",
          "am write",
          "write"
        ],
        "explain": "Tiếp diễn cần đủ hai phần là am và đuôi -ing.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-15",
        "kind": "mcq",
        "prompt": "___ you waiting for the bus?",
        "answers": [
          "Are"
        ],
        "options": [
          "Are",
          "Do",
          "Is"
        ],
        "explain": "Thì tiếp diễn đảo chính are lên trước chủ ngữ, không mượn do.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-16",
        "kind": "cloze",
        "prompt": "He ___ to the gym after work.",
        "answers": [
          "always goes"
        ],
        "explain": "Trạng từ tần suất nằm ở khe giữa chủ ngữ và động từ thường.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-17",
        "kind": "cloze",
        "prompt": "My teacher ___ very patient with us.",
        "answers": [
          "is always"
        ],
        "explain": "Gặp to be thì trạng từ tần suất lùi ra sau.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-18",
        "kind": "mcq",
        "prompt": "I ___ up at six.",
        "answers": [
          "usually get"
        ],
        "options": [
          "usually get",
          "get usually",
          "am usually get"
        ],
        "explain": "usually đứng ngay trước động từ thường, không chen ra sau.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-19",
        "kind": "cloze",
        "prompt": "I ___ the answer to this question.",
        "answers": [
          "know"
        ],
        "explain": "know nói về trạng thái trong đầu chứ không phải việc đang làm.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-20",
        "kind": "mcq",
        "prompt": "She ___ a new bicycle for her birthday.",
        "answers": [
          "wants"
        ],
        "options": [
          "wants",
          "is wanting",
          "want"
        ],
        "explain": "want là động từ trạng thái, và chủ ngữ she cần đuôi -s.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-21",
        "kind": "cloze",
        "prompt": "I ___ the lesson now, thank you. ",
        "answers": [
          "understand"
        ],
        "cue": "understand",
        "explain": "Có chữ now nhưng understand vẫn ở hiện tại đơn vì là động từ trạng thái.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-22",
        "kind": "cloze",
        "prompt": "This bag ___ to my sister.",
        "answers": [
          "belongs"
        ],
        "explain": "belong chỉ quan hệ sở hữu nên không có dạng tiếp diễn.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-23",
        "kind": "mcq",
        "prompt": "They ___ his story.",
        "answers": [
          "do not believe"
        ],
        "options": [
          "do not believe",
          "are not believing",
          "does not believe"
        ],
        "explain": "believe thuộc nhóm trạng thái nên phủ định mượn do.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-24",
        "kind": "cloze",
        "prompt": "We ___ the client at ten tomorrow. ",
        "answers": [
          "are meeting"
        ],
        "cue": "meet",
        "explain": "Lịch đã hẹn chắc chắn thì nói bằng tiếp diễn dù việc ở tương lai.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-25",
        "kind": "mcq",
        "prompt": "We ___ dinner with my parents this evening.",
        "answers": [
          "are having"
        ],
        "options": [
          "are having",
          "have",
          "are haveing"
        ],
        "explain": "Bữa tối đã hẹn trước nên thuộc nhóm kế hoạch gần.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-26",
        "kind": "cloze",
        "prompt": "He is ___ his keys.",
        "answers": [
          "always losing"
        ],
        "explain": "always kèm tiếp diễn là cách than phiền về việc lặp lại quá nhiều.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-27",
        "kind": "transform",
        "prompt": "I get up at six every day.",
        "answers": [
          "My brother gets up at six every day."
        ],
        "explain": "Đổi sang chủ ngữ ngôi thứ ba thì động từ phải thêm -s.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-28",
        "kind": "transform",
        "prompt": "She lives in Ha Noi.",
        "answers": [
          "She does not live in Ha Noi."
        ],
        "explain": "Đuôi -s chuyển sang trợ động từ does, động từ chính về nguyên thể.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-29",
        "kind": "transform",
        "prompt": "Your parents live in Hue.",
        "answers": [
          "Do your parents live in Hue?"
        ],
        "explain": "Câu hỏi mượn Do đặt trước chủ ngữ, không đảo động từ chính.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-30",
        "kind": "transform",
        "prompt": "They play football every Sunday.",
        "answers": [
          "They are playing football now."
        ],
        "explain": "Chữ now báo việc đang xảy ra nên chuyển sang are cùng đuôi -ing.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "present-simple-31",
        "kind": "transform",
        "prompt": "We have arranged to meet the client at ten tomorrow.",
        "answers": [
          "We are meeting the client at ten tomorrow."
        ],
        "explain": "Kế hoạch đã chốt lịch được nói gọn bằng hiện tại tiếp diễn.",
        "errorTag": "Thiếu -s ngôi 3"
      }
    ]
  },
  {
    "key": "word-order",
    "builtin": true,
    "name": "Trật tự từ & câu hỏi",
    "nameEn": "Word order and questions",
    "level": "A1",
    "group": "Trật tự từ & nhấn mạnh",
    "description": "Tiếng Anh giữ chặt thứ tự chủ ngữ - động từ - tân ngữ, đặt tính từ trước danh từ và đảo trợ động từ khi hỏi. Tiếng Việt để tính từ sau danh từ và chỉ cần thêm “không” ở cuối câu là thành câu hỏi, nên người học hay bê nguyên trật tự cũ sang.",
    "icon": "shuffle",
    "tags": [
      "Trật tự từ"
    ],
    "signals": [
      "who",
      "what",
      "where",
      "when",
      "why",
      "how",
      "do",
      "does",
      "did",
      "could you tell me"
    ],
    "formulas": [
      {
        "form": "Câu trần thuật cơ bản",
        "structure": "S + V + O",
        "example": "My sister bought a new phone."
      },
      {
        "form": "Tính từ đứng trước danh từ",
        "structure": "tính từ + danh từ",
        "example": "She has a beautiful red dress."
      },
      {
        "form": "Trạng ngữ nơi chốn trước thời gian",
        "structure": "S + V + nơi chốn + thời gian",
        "example": "We met at the café last Sunday."
      },
      {
        "form": "Câu hỏi Yes hoặc No",
        "structure": "Trợ động từ + S + V",
        "example": "Do you live near the school?"
      },
      {
        "form": "Câu hỏi wh- có trợ động từ",
        "structure": "Từ hỏi + trợ động từ + S + V",
        "example": "What did you buy yesterday?"
      },
      {
        "form": "Câu hỏi về chính chủ ngữ",
        "structure": "Who hoặc What + V",
        "example": "Who broke this window?"
      },
      {
        "form": "Câu hỏi gián tiếp",
        "structure": "Từ hỏi + S + V, không đảo",
        "example": "Could you tell me where the station is?"
      }
    ],
    "uses": [
      {
        "name": "Thứ tự cơ bản của câu kể",
        "sample": "My sister {bought a new phone} yesterday.",
        "note": "Tân ngữ đứng ngay sau động từ. Tiếng Việt có thể đảo tân ngữ lên đầu để nhấn mạnh, tiếng Anh thì hiếm khi làm vậy."
      },
      {
        "name": "Tính từ đứng trước danh từ",
        "sample": "She lives in a {small white} house.",
        "note": "Tiếng Việt nói “ngôi nhà nhỏ màu trắng”, tính từ chạy sau. Tiếng Anh dồn hết tính từ lên trước danh từ."
      },
      {
        "name": "Thứ tự khi có nhiều tính từ",
        "sample": "He bought a {nice old Italian} car.",
        "note": "Nhận xét chủ quan đứng trước, rồi tới tuổi, cuối cùng là xuất xứ. Đảo thứ tự này nghe rất lạ tai."
      },
      {
        "name": "Nơi chốn trước thời gian",
        "sample": "We met {at the café last Sunday}.",
        "note": "Khi đứng cuối câu, cụm chỉ nơi chốn xếp trước cụm chỉ thời gian."
      },
      {
        "name": "Câu hỏi Yes hoặc No với động từ thường",
        "sample": "{Do} you live near the school?",
        "note": "Động từ thường phải mượn do rồi đưa do lên trước chủ ngữ. Chỉ lên giọng cuối câu là chưa thành câu hỏi."
      },
      {
        "name": "Câu hỏi Yes hoặc No với to be",
        "sample": "{Are} you ready for the test?",
        "note": "Có sẵn to be thì đảo chính nó, không mượn thêm do."
      },
      {
        "name": "Câu hỏi wh- có trợ động từ",
        "sample": "What {did you buy} at the market?",
        "note": "Có từ hỏi rồi vẫn phải đảo trợ động từ lên trước chủ ngữ như thường."
      },
      {
        "name": "Câu hỏi về chính chủ ngữ",
        "sample": "Who {broke} this window?",
        "note": "Từ hỏi đã đóng vai chủ ngữ nên không mượn did, động từ chia thẳng như câu kể."
      },
      {
        "name": "Câu hỏi gián tiếp",
        "sample": "Could you tell me where {the station is}?",
        "note": "Phần sau tell me quay về trật tự câu trần thuật, chủ ngữ đứng trước động từ."
      }
    ],
    "traps": [
      {
        "wrong": "She has a dress red and a bag new.",
        "right": "She has a red dress and a new bag.",
        "why": "Tiếng Việt nói “chiếc váy đỏ”, danh từ đứng trước tính từ. Tiếng Anh làm ngược lại, tính từ luôn chạy lên trước."
      },
      {
        "wrong": "I like very much this song.",
        "right": "I like this song very much.",
        "why": "Người học dịch thẳng “tôi rất thích bài này”. Trong tiếng Anh, tân ngữ bám sát động từ nên very much bị đẩy ra cuối."
      },
      {
        "wrong": "You like Vietnamese coffee?",
        "right": "Do you like Vietnamese coffee?",
        "why": "Tiếng Việt hỏi bằng cách thêm “không” ở cuối câu, trật tự không đổi. Tiếng Anh phải mượn do và đưa nó lên trước chủ ngữ."
      },
      {
        "wrong": "Where you are from?",
        "right": "Where are you from?",
        "why": "Có từ hỏi rồi người học tưởng thế là đủ. Sau từ hỏi vẫn phải đảo to be lên trước chủ ngữ."
      },
      {
        "wrong": "What did you bought yesterday?",
        "right": "What did you buy yesterday?",
        "why": "did đã đánh dấu quá khứ nên động từ chính về nguyên thể. Chia quá khứ hai lần là thừa."
      },
      {
        "wrong": "Who did break the window?",
        "right": "Who broke the window?",
        "why": "Khi who chính là người làm việc đó thì câu giữ trật tự như câu kể, không cần trợ động từ."
      },
      {
        "wrong": "Can you tell me where is the station?",
        "right": "Can you tell me where the station is?",
        "why": "Đây là câu hỏi lồng trong lời đề nghị. Phần sau tell me phải trả về trật tự chủ ngữ trước động từ."
      }
    ],
    "compare": {
      "with": "Câu trần thuật",
      "rows": [
        {
          "key": "Vị trí chủ ngữ",
          "other": "Đứng trước động từ: You are ready.",
          "self": "Đứng sau trợ động từ: Are you ready?"
        },
        {
          "key": "Trợ động từ",
          "other": "Không cần với động từ thường",
          "self": "Bắt buộc có do, does hoặc did với động từ thường"
        },
        {
          "key": "Dạng động từ chính",
          "other": "Chia theo ngôi và theo thì",
          "self": "Về nguyên thể vì trợ động từ đã mang dấu hiệu thì"
        },
        {
          "key": "Từ hỏi",
          "other": "Không có",
          "self": "Đứng đầu câu, trừ khi chính nó là chủ ngữ"
        },
        {
          "key": "Ví dụ đối chiếu",
          "other": "She went to Hue last week.",
          "self": "Where did she go last week?"
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Đặt tính từ sau danh từ, kiểu a house small",
          "self": "Không đảo ngữ, chỉ lên giọng cuối câu: You like coffee?"
        }
      ]
    },
    "items": [
      {
        "id": "word-order-1",
        "kind": "mcq",
        "prompt": "He ___ for my birthday.",
        "answers": [
          "gave me a book"
        ],
        "options": [
          "gave me a book",
          "gave a book me",
          "me gave a book"
        ],
        "explain": "Tân ngữ chỉ người đứng ngay sau động từ khi không có giới từ to.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-2",
        "kind": "cloze",
        "prompt": "I ___.",
        "answers": [
          "like this song very much"
        ],
        "explain": "Tân ngữ bám sát động từ, cụm very much bị đẩy ra cuối câu.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-3",
        "kind": "mcq",
        "prompt": "My mother ___.",
        "answers": [
          "cooks dinner every evening"
        ],
        "options": [
          "cooks dinner every evening",
          "cooks every evening dinner",
          "every evening cooks dinner"
        ],
        "explain": "Tân ngữ đứng trước, mốc thời gian xếp sau cùng.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-4",
        "kind": "cloze",
        "prompt": "She was wearing a ___ at the party.",
        "answers": [
          "red dress"
        ],
        "explain": "Tiếng Việt để tính từ sau danh từ, tiếng Anh thì ngược lại.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-5",
        "kind": "mcq",
        "prompt": "They live in a ___ near the river.",
        "answers": [
          "big old house"
        ],
        "options": [
          "big old house",
          "old big house",
          "house big old"
        ],
        "explain": "Tính từ chỉ kích thước đứng trước tính từ chỉ tuổi.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-6",
        "kind": "mcq",
        "prompt": "I bought a ___.",
        "answers": [
          "beautiful red silk scarf"
        ],
        "options": [
          "beautiful red silk scarf",
          "red beautiful silk scarf",
          "silk red beautiful scarf"
        ],
        "explain": "Nhận xét chủ quan đứng đầu, rồi màu sắc, cuối cùng là chất liệu.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-7",
        "kind": "cloze",
        "prompt": "He drives a ___.",
        "answers": [
          "small Japanese car"
        ],
        "explain": "Kích thước đứng trước xuất xứ, và cả hai đều nằm trước danh từ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-8",
        "kind": "cloze",
        "prompt": "I ___ at the market.",
        "answers": [
          "saw my old teacher yesterday"
        ],
        "explain": "Không chen trạng ngữ thời gian vào giữa động từ và tân ngữ của nó.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-9",
        "kind": "cloze",
        "prompt": "She goes ___.",
        "answers": [
          "to school every morning"
        ],
        "explain": "Nơi đến bám sát động từ, mốc thời gian lùi ra sau cùng.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-10",
        "kind": "mcq",
        "prompt": "He ___ for class.",
        "answers": [
          "always arrives early"
        ],
        "options": [
          "always arrives early",
          "arrives always early",
          "early always arrives"
        ],
        "explain": "Trạng từ tần suất đứng ngay trước động từ thường.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-11",
        "kind": "mcq",
        "prompt": "My father ___ for work.",
        "answers": [
          "is never late"
        ],
        "options": [
          "is never late",
          "never is late",
          "is late never"
        ],
        "explain": "Gặp to be thì trạng từ tần suất lùi ra sau nó.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-12",
        "kind": "cloze",
        "prompt": "___ you live near the school?",
        "answers": [
          "Do"
        ],
        "explain": "Động từ thường ở câu hỏi phải mượn trợ động từ đặt trước chủ ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-13",
        "kind": "cloze",
        "prompt": "___ your father work in Ha Noi?",
        "answers": [
          "Does"
        ],
        "explain": "Chủ ngữ ngôi thứ ba số ít nên trợ động từ đổi thành does.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-14",
        "kind": "cloze",
        "prompt": "___ you ready for the test tomorrow?",
        "answers": [
          "Are"
        ],
        "explain": "Có sẵn to be thì đảo chính nó lên đầu, không mượn thêm do.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-15",
        "kind": "cloze",
        "prompt": "___ your brother at home now?",
        "answers": [
          "Is"
        ],
        "explain": "Chủ ngữ số ít nên to be là is, và nó nhảy lên trước chủ ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-16",
        "kind": "cloze",
        "prompt": "___ Vietnamese food?",
        "answers": [
          "Do you like"
        ],
        "explain": "Tiếng Việt chỉ thêm “không” ở cuối câu, tiếng Anh phải đảo trợ động từ lên đầu.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-17",
        "kind": "mcq",
        "prompt": "___ to the party last night?",
        "answers": [
          "Did you go"
        ],
        "options": [
          "Did you go",
          "Did you went",
          "You did go"
        ],
        "explain": "did đã đánh dấu quá khứ nên động từ chính về nguyên thể.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-18",
        "kind": "cloze",
        "prompt": "Where ___ you from?",
        "answers": [
          "are"
        ],
        "explain": "Sau từ hỏi vẫn phải đảo to be lên trước chủ ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-19",
        "kind": "cloze",
        "prompt": "What time ___ the film start?",
        "answers": [
          "does"
        ],
        "explain": "Chủ ngữ the film thuộc ngôi thứ ba số ít.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-20",
        "kind": "cloze",
        "prompt": "What ___ your parents doing at the moment?",
        "answers": [
          "are"
        ],
        "explain": "Chủ ngữ số nhiều nên to be là are, và nó vẫn đứng trước chủ ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-21",
        "kind": "cloze",
        "prompt": "Where ___ this weekend?",
        "answers": [
          "are you going"
        ],
        "explain": "Có từ hỏi rồi vẫn không bỏ được bước đảo ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-22",
        "kind": "mcq",
        "prompt": "What ___ at the market?",
        "answers": [
          "did you buy"
        ],
        "options": [
          "did you buy",
          "did you bought",
          "you bought"
        ],
        "explain": "Dấu hiệu quá khứ nằm ở did nên buy giữ nguyên thể.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-23",
        "kind": "cloze",
        "prompt": "Who ___ this window? ",
        "answers": [
          "broke"
        ],
        "cue": "break",
        "explain": "who chính là người làm việc đó nên không mượn did, động từ chia thẳng.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-24",
        "kind": "cloze",
        "prompt": "Who ___ you about the meeting?",
        "answers": [
          "told"
        ],
        "explain": "Hỏi về chủ ngữ thì câu giữ nguyên trật tự của câu kể.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-25",
        "kind": "cloze",
        "prompt": "Could you tell me where ___?",
        "answers": [
          "the station is"
        ],
        "explain": "Câu hỏi lồng bên trong quay về trật tự chủ ngữ trước động từ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-26",
        "kind": "mcq",
        "prompt": "I do not know what ___.",
        "answers": [
          "he wants"
        ],
        "options": [
          "he wants",
          "does he want",
          "wants he"
        ],
        "explain": "Phần sau what xếp như câu kể vì đây không còn là câu hỏi trực tiếp.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-27",
        "kind": "cloze",
        "prompt": "Can you tell me what time the meeting ___? ",
        "answers": [
          "starts"
        ],
        "cue": "start",
        "explain": "Sau what time là chủ ngữ rồi mới tới động từ, và động từ chia bình thường.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-28",
        "kind": "transform",
        "prompt": "You like Vietnamese coffee.",
        "answers": [
          "Do you like Vietnamese coffee?"
        ],
        "explain": "Động từ thường nên câu hỏi phải mượn Do đặt trước chủ ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-29",
        "kind": "transform",
        "prompt": "She went to Hue last week.",
        "answers": [
          "Where did she go last week?"
        ],
        "explain": "did nhận dấu hiệu quá khứ nên went trở lại nguyên thể.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-30",
        "kind": "transform",
        "prompt": "He has a car. It is red and small.",
        "answers": [
          "He has a small red car."
        ],
        "explain": "Tính từ dồn lên trước danh từ, kích thước đứng trước màu sắc.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-31",
        "kind": "transform",
        "prompt": "Where is the post office?",
        "answers": [
          "Could you tell me where the post office is?"
        ],
        "explain": "Thành câu hỏi gián tiếp thì bỏ đảo ngữ, đưa động từ ra sau chủ ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "word-order-32",
        "kind": "transform",
        "prompt": "Somebody broke the window.",
        "answers": [
          "Who broke the window?"
        ],
        "explain": "Hỏi về chính người làm thì thay chủ ngữ bằng who, động từ giữ nguyên.",
        "errorTag": "Trật tự từ"
      }
    ]
  },
  {
    "key": "past-simple",
    "builtin": true,
    "name": "Quá khứ đơn & tiếp diễn",
    "nameEn": "Past simple and continuous",
    "level": "A2",
    "group": "Thì động từ",
    "description": "Kể lại việc đã khép lại trong quá khứ, và việc còn đang dở tại một mốc quá khứ. Tiếng Việt chỉ có một chữ “đã” dùng chung cho mọi chuyện cũ nên người học không tách được hai thì này, lại hay chia thì thêm một lần nữa sau did.",
    "icon": "repeat",
    "tags": [
      "Nhầm thì"
    ],
    "signals": [
      "yesterday",
      "last night",
      "last week",
      "ago",
      "in 2019",
      "when",
      "while",
      "at that moment",
      "used to",
      "this morning"
    ],
    "formulas": [
      {
        "form": "Quá khứ đơn — khẳng định",
        "structure": "S + V2 hoặc V-ed",
        "example": "We watched a film at home last night."
      },
      {
        "form": "Quá khứ đơn — phủ định và câu hỏi",
        "structure": "S + did not + V nguyên thể · Did + S + V nguyên thể?",
        "example": "Did you go to the doctor last week?"
      },
      {
        "form": "Động từ to be ở quá khứ",
        "structure": "S + was / were (+ not)",
        "example": "The shops were closed yesterday."
      },
      {
        "form": "Quá khứ tiếp diễn",
        "structure": "S + was / were + V-ing",
        "example": "At nine o'clock last night I was cooking dinner."
      },
      {
        "form": "Việc dài bị việc ngắn cắt ngang",
        "structure": "S + was / were + V-ing + when + S + V2",
        "example": "I was reading a book when the lights went out."
      },
      {
        "form": "Hai việc dài chạy song song",
        "structure": "While + S + was / were + V-ing, S + was / were + V-ing",
        "example": "While my sister was studying, I was cooking dinner."
      },
      {
        "form": "Thói quen đã chấm dứt",
        "structure": "S + used to + V nguyên thể",
        "example": "We used to live in a small flat near the market."
      }
    ],
    "uses": [
      {
        "name": "Việc xong hẳn tại một mốc quá khứ",
        "sample": "We {moved} to Da Nang in 2019.",
        "note": "Mốc in 2019 đã đóng lại, không còn liên quan tới hiện tại. Đây là vùng của quá khứ đơn."
      },
      {
        "name": "Chuỗi việc nối tiếp nhau",
        "sample": "She {opened} the door, {took} off her shoes and {sat} down.",
        "note": "Các việc xảy ra lần lượt, việc này xong mới tới việc kia, nên tất cả đều ở quá khứ đơn."
      },
      {
        "name": "Phủ định và câu hỏi ở quá khứ",
        "sample": "I {did not see} her at the meeting yesterday.",
        "note": "Dấu quá khứ đã nằm ở did nên động từ chính quay về nguyên thể. Chia hai lần là lỗi."
      },
      {
        "name": "Câu hỏi mượn trợ động từ did",
        "sample": "{Did} you {go} to the doctor last week?",
        "note": "Câu hỏi quá khứ giữ khuôn did + chủ ngữ + V nguyên thể, không đổi dạng động từ chính."
      },
      {
        "name": "Việc còn đang dở tại một mốc quá khứ",
        "sample": "At nine o'clock last night I {was still working}.",
        "note": "Câu không nói việc bắt đầu hay kết thúc lúc nào, chỉ chụp lại một lát cắt nên dùng was + V-ing."
      },
      {
        "name": "Việc dài làm nền cho việc ngắn",
        "sample": "I {was crossing} the street when someone {called} my name.",
        "note": "Việc kéo dài dùng tiếp diễn, việc ngắn cắt ngang dùng quá khứ đơn. Đảo ngược lại là đổi nghĩa."
      },
      {
        "name": "Hai việc kéo dài cùng lúc",
        "sample": "While I {was cooking}, my sister {was setting} the table.",
        "note": "Hai việc chạy song song trong cùng một quãng thời gian nên cả hai vế đều tiếp diễn."
      },
      {
        "name": "Tả khung cảnh mở đầu câu chuyện",
        "sample": "It {was raining} and the streets {were} empty.",
        "note": "Tiếp diễn dựng bối cảnh, sau đó quá khứ đơn mới kể việc chính xảy ra."
      },
      {
        "name": "Thói quen cũ nay không còn",
        "sample": "We {used to} live in a small flat near the market.",
        "note": "used to nói rõ việc từng đúng trong quá khứ và giờ đã chấm dứt, điều mà quá khứ đơn không nói ra được."
      }
    ],
    "traps": [
      {
        "wrong": "Did you went to the party last night?",
        "right": "Did you go to the party last night?",
        "why": "did đã gánh dấu quá khứ cho cả câu. Tiếng Việt đặt chữ “đã” ở đâu cũng được nên người học vô thức đánh dấu quá khứ hai lần."
      },
      {
        "wrong": "I didn't saw him at the meeting yesterday.",
        "right": "I did not see him at the meeting yesterday.",
        "why": "Sau did not, động từ chính luôn trở về nguyên thể. Đây là cùng một lỗi chia hai lần, chỉ khác ở câu phủ định."
      },
      {
        "wrong": "Yesterday I have met an old friend.",
        "right": "Yesterday I met an old friend.",
        "why": "Đã có mốc yesterday thì việc đóng hẳn trong quá khứ. Người Việt dịch “tôi đã gặp” thành have met vì thấy chữ “đã”."
      },
      {
        "wrong": "When she called me, I watched TV.",
        "right": "When she called me, I was watching TV.",
        "why": "Việc xem tivi bắt đầu trước cuộc gọi và vẫn đang chạy, nên phải ở dạng tiếp diễn. Tiếng Việt không bắt phân biệt nên hai câu nghe như một."
      },
      {
        "wrong": "I reading a book when he came in.",
        "right": "I was reading a book when he came in.",
        "why": "Quá khứ tiếp diễn cần đủ was hoặc were rồi mới tới V-ing. Tiếng Việt nói “tôi đang đọc sách” không cần động từ to be nên phần này hay rơi mất."
      },
      {
        "wrong": "My father used to smoking a lot.",
        "right": "My father used to smoke a lot.",
        "why": "Chữ to ở đây thuộc khuôn used to, phía sau luôn là động từ nguyên thể chứ không phải V-ing."
      },
      {
        "wrong": "My grandfather born in a small village.",
        "right": "My grandfather was born in a small village.",
        "why": "Tiếng Anh diễn đạt việc sinh ra ở dạng bị động nên luôn cần was hoặc were, còn tiếng Việt chỉ có một chữ “sinh”."
      }
    ],
    "compare": {
      "with": "Hiện tại hoàn thành",
      "rows": [
        {
          "key": "Mốc thời gian",
          "other": "Không nói rõ lúc nào, việc còn nối với hiện tại",
          "self": "Có mốc quá khứ xác định: yesterday, last week, in 2019"
        },
        {
          "key": "Từ đi kèm",
          "other": "already, just, yet, ever, since, for",
          "self": "yesterday, ago, last night, when, while, at that moment"
        },
        {
          "key": "Dạng động từ",
          "other": "have hoặc has + V3",
          "self": "V2 hay V-ed, hoặc was / were + V-ing"
        },
        {
          "key": "Sắc thái",
          "other": "Kết quả còn giá trị ngay lúc nói",
          "self": "Chuyện đã khép lại, chỉ kể lại cho người nghe"
        },
        {
          "key": "Ví dụ đối chiếu",
          "other": "I have lost my keys.",
          "self": "I lost my keys yesterday."
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Thấy chữ “đã” là chọn hiện tại hoàn thành cho mọi câu",
          "self": "Chia thì hai lần sau did, hoặc dùng quá khứ đơn cho việc đang dở"
        }
      ]
    },
    "items": [
      {
        "id": "past-simple-1",
        "kind": "cloze",
        "prompt": "We ___ a film at home last night. ",
        "answers": [
          "watched"
        ],
        "cue": "watch",
        "explain": "Mốc last night đã khép lại nên động từ phải mang dấu quá khứ.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-2",
        "kind": "cloze",
        "prompt": "She ___ a new bicycle two weeks ago. ",
        "answers": [
          "bought"
        ],
        "cue": "buy",
        "explain": "buy nằm trong nhóm bất quy tắc, đổi hẳn dạng chứ không thêm đuôi -ed.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-3",
        "kind": "mcq",
        "prompt": "My parents ___ in Hue in 1995.",
        "answers": [
          "met"
        ],
        "options": [
          "met",
          "meet",
          "meeted",
          "have met"
        ],
        "explain": "Có mốc năm cụ thể nên việc đóng hẳn trong quá khứ, và meet là động từ bất quy tắc.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-4",
        "kind": "correct",
        "prompt": "Last summer we go to Nha Trang for a week.",
        "answers": [
          "went"
        ],
        "tokens": [
          "Last",
          "summer",
          "we",
          "go",
          "to",
          "Nha",
          "Trang",
          "for",
          "a",
          "week."
        ],
        "errIndex": 3,
        "explain": "Cụm last summer chốt việc vào quá khứ, động từ không thể để nguyên dạng.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-5",
        "kind": "cloze",
        "prompt": "The concert ___ on time. ",
        "answers": [
          "did not start"
        ],
        "cue": "not start",
        "explain": "Câu phủ định ở quá khứ mượn did, còn động từ chính giữ nguyên thể.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-6",
        "kind": "mcq",
        "prompt": "___ to the doctor last week?",
        "answers": [
          "Did you go"
        ],
        "options": [
          "Did you go",
          "Did you went",
          "Do you went",
          "You did go"
        ],
        "explain": "did đã mang dấu quá khứ nên động từ đứng sau chủ ngữ ở dạng nguyên thể.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-7",
        "kind": "correct",
        "prompt": "I did not saw her at the meeting yesterday.",
        "answers": [
          "see"
        ],
        "tokens": [
          "I",
          "did",
          "not",
          "saw",
          "her",
          "at",
          "the",
          "meeting",
          "yesterday."
        ],
        "errIndex": 3,
        "explain": "Chỉ một chỗ trong câu được đánh dấu quá khứ, và chỗ đó là did.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-8",
        "kind": "cloze",
        "prompt": "The shops ___ closed when we arrived. ",
        "answers": [
          "were"
        ],
        "cue": "be",
        "explain": "Chủ ngữ số nhiều the shops kéo theo dạng số nhiều của động từ to be ở quá khứ.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-9",
        "kind": "correct",
        "prompt": "My grandfather born in a small village in 1940.",
        "answers": [
          "was born"
        ],
        "tokens": [
          "My",
          "grandfather",
          "born",
          "in",
          "a",
          "small",
          "village",
          "in",
          "1940."
        ],
        "errIndex": 2,
        "explain": "Tiếng Anh nói về việc sinh ra bằng cấu trúc bị động nên bắt buộc có to be.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-10",
        "kind": "cloze",
        "prompt": "At nine o'clock last night I ___ dinner. ",
        "answers": [
          "was cooking"
        ],
        "cue": "cook",
        "explain": "Câu chụp lại một lát cắt giờ giấc, việc nấu ăn lúc đó còn đang dở.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-11",
        "kind": "mcq",
        "prompt": "This time yesterday we ___ to Bangkok.",
        "answers": [
          "were flying"
        ],
        "options": [
          "were flying",
          "flew",
          "are flying",
          "were flew"
        ],
        "explain": "Cụm this time yesterday chỉ một khoảnh khắc, chuyến bay khi ấy chưa kết thúc.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-12",
        "kind": "cloze",
        "prompt": "I ___ a book when the lights went out. ",
        "answers": [
          "was reading"
        ],
        "cue": "read",
        "explain": "Việc đọc kéo dài làm nền, việc mất điện xen ngang giữa chừng.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-13",
        "kind": "mcq",
        "prompt": "While I was walking home, it ___ to rain.",
        "answers": [
          "started"
        ],
        "options": [
          "started",
          "was starting",
          "starts",
          "had started"
        ],
        "explain": "Vế while là nền dài rồi, nên việc xen vào phải ở dạng ngắn gọn của quá khứ đơn.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-14",
        "kind": "correct",
        "prompt": "When she phoned me, I watched a film.",
        "answers": [
          "was watching"
        ],
        "tokens": [
          "When",
          "she",
          "phoned",
          "me,",
          "I",
          "watched",
          "a",
          "film."
        ],
        "errIndex": 5,
        "explain": "Bộ phim đã bắt đầu trước cuộc gọi và vẫn đang chạy khi chuông reo.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-15",
        "kind": "cloze",
        "prompt": "While my sister ___, I was cooking dinner. ",
        "answers": [
          "was studying"
        ],
        "cue": "study",
        "explain": "Hai việc chiếm cùng một quãng thời gian nên cả hai vế đều ở dạng tiếp diễn.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-16",
        "kind": "mcq",
        "prompt": "I ___ the street when someone called my name.",
        "answers": [
          "was crossing"
        ],
        "options": [
          "was crossing",
          "crossed",
          "am crossing",
          "was crossed"
        ],
        "explain": "Việc băng qua đường đang dở giữa chừng thì bị tiếng gọi cắt ngang.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-17",
        "kind": "cloze",
        "prompt": "The sun ___ and the birds were singing. ",
        "answers": [
          "was shining"
        ],
        "cue": "shine",
        "explain": "Câu mở đầu dựng khung cảnh nên cả hai vế đều ở dạng tiếp diễn.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-18",
        "kind": "correct",
        "prompt": "While we waited for the bus, we met an old friend.",
        "answers": [
          "were waiting"
        ],
        "tokens": [
          "While",
          "we",
          "waited",
          "for",
          "the",
          "bus,",
          "we",
          "met",
          "an",
          "old",
          "friend."
        ],
        "errIndex": 2,
        "explain": "Vế sau while là quãng chờ kéo dài, còn cuộc gặp mới là việc xen vào.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-19",
        "kind": "mcq",
        "prompt": "My phone rang ___ dinner.",
        "answers": [
          "while I was having"
        ],
        "options": [
          "while I was having",
          "while I had",
          "during I was having",
          "when I have"
        ],
        "explain": "while nối với một mệnh đề đang diễn ra, còn during chỉ đứng trước danh từ.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-20",
        "kind": "cloze",
        "prompt": "We ___ to live in a small flat near the market. ",
        "answers": [
          "used"
        ],
        "cue": "use",
        "explain": "Khuôn nói về nếp sống cũ đã chấm dứt luôn ở dạng quá khứ, dù phía sau có to.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-21",
        "kind": "correct",
        "prompt": "My father used to smoking, but he stopped in 2010.",
        "answers": [
          "smoke"
        ],
        "tokens": [
          "My",
          "father",
          "used",
          "to",
          "smoking,",
          "but",
          "he",
          "stopped",
          "in",
          "2010."
        ],
        "errIndex": 4,
        "explain": "Chữ to trong khuôn này kéo theo động từ nguyên thể, không phải V-ing.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-22",
        "kind": "mcq",
        "prompt": "There ___ a cinema on this street.",
        "answers": [
          "used to be"
        ],
        "options": [
          "used to be",
          "used to have",
          "was used to be",
          "uses to be"
        ],
        "explain": "Muốn nói trước kia có mà nay không còn thì dùng khuôn there kết hợp với be.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-23",
        "kind": "cloze",
        "prompt": "When I was a child, I ___ to school every day. ",
        "answers": [
          "walked"
        ],
        "cue": "walk",
        "explain": "Việc lặp lại đều đặn không phải việc đang dở, nên không dùng dạng tiếp diễn.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-24",
        "kind": "cloze",
        "prompt": "I ___ my homework two hours ago.",
        "answers": [
          "finished"
        ],
        "explain": "Cụm two hours ago chốt một mốc đã đóng, không còn nối với hiện tại nữa.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-25",
        "kind": "mcq",
        "prompt": "Yesterday I ___ an old friend at the station.",
        "answers": [
          "met"
        ],
        "options": [
          "met",
          "have met",
          "was meeting",
          "meet"
        ],
        "explain": "yesterday là mốc xác định nên câu thuộc hẳn về quá khứ, dù tiếng Việt vẫn nói “đã gặp”.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-26",
        "kind": "transform",
        "prompt": "I do not smoke now, but I smoked a lot in my twenties.",
        "answers": [
          "I used to smoke a lot in my twenties."
        ],
        "explain": "Một nếp cũ đã dừng hẳn được gói gọn lại bằng khuôn used to.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-27",
        "kind": "transform",
        "prompt": "There was a bakery on this street before, but it closed last year.",
        "answers": [
          "There used to be a bakery on this street."
        ],
        "explain": "Khuôn there used to be nói đủ ý trước kia có mà nay không còn, khỏi cần vế thứ hai.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-28",
        "kind": "transform",
        "prompt": "I was in the middle of my dinner when my brother arrived.",
        "answers": [
          "I was having dinner when my brother arrived."
        ],
        "explain": "Ý đang dở giữa chừng chuyển thẳng thành was cộng với V-ing.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-29",
        "kind": "transform",
        "prompt": "It started to rain during my walk home.",
        "answers": [
          "While I was walking home, it started to rain."
        ],
        "explain": "Cụm during đi với danh từ, muốn đổi sang while thì phải dựng lại thành một mệnh đề tiếp diễn.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "past-simple-30",
        "kind": "transform",
        "prompt": "The last time I saw him was three years ago.",
        "answers": [
          "I saw him three years ago."
        ],
        "explain": "Cụm ago chốt mốc quá khứ nên động từ chính lùi thẳng về dạng quá khứ đơn.",
        "errorTag": "Nhầm thì"
      }
    ]
  },
  {
    "key": "subject-verb",
    "builtin": true,
    "name": "Hòa hợp chủ ngữ – động từ",
    "nameEn": "Subject-verb agreement",
    "level": "A2",
    "group": "Động từ & cấu trúc",
    "description": "Động từ phải đổi dạng theo chủ ngữ. Tiếng Việt không có bước này — “tôi ăn, nó ăn, họ ăn” đều một chữ — nên người học bỏ quên đuôi -s ngôi thứ ba, rơi mất to be, và hay chia theo danh từ đứng gần động từ nhất thay vì chủ ngữ thật.",
    "icon": "target",
    "tags": [
      "Thiếu -s ngôi 3",
      "Thiếu to be"
    ],
    "signals": [
      "each",
      "every",
      "everyone",
      "either or",
      "neither nor",
      "there is",
      "there are",
      "a number of",
      "the number of",
      "police"
    ],
    "formulas": [
      {
        "form": "Chủ ngữ số ít ngôi thứ ba",
        "structure": "S số ít + V-s hoặc V-es",
        "example": "My brother works in a bank."
      },
      {
        "form": "Chủ ngữ số nhiều",
        "structure": "S số nhiều + V nguyên thể",
        "example": "My cousins work in a bank."
      },
      {
        "form": "Động từ to be",
        "structure": "I am · S số ít is · S số nhiều are",
        "example": "The keys are on the kitchen table."
      },
      {
        "form": "Cụm giới từ xen giữa",
        "structure": "S + of / with / in + N + V chia theo S",
        "example": "The box of chocolates is on the top shelf."
      },
      {
        "form": "Khuôn there",
        "structure": "There is + N số ít · There are + N số nhiều",
        "example": "There are two cafes next to my house."
      },
      {
        "form": "each, every, everyone",
        "structure": "Each / Every + N số ít + V số ít",
        "example": "Every student in the class has a locker."
      },
      {
        "form": "either… or và neither… nor",
        "structure": "… or / nor + N + V chia theo N gần động từ nhất",
        "example": "Neither my brothers nor my father likes football."
      }
    ],
    "uses": [
      {
        "name": "Chủ ngữ là một người hoặc một vật",
        "sample": "My sister {works} at a hospital in Hue.",
        "note": "Chủ ngữ thay được bằng she nên động từ mang đuôi -s. Đây là chỗ bị bỏ quên nhiều nhất."
      },
      {
        "name": "Chủ ngữ gồm nhiều người hoặc nhiều vật",
        "sample": "My cousins {live} in Da Nang and they {work} there too.",
        "note": "Chủ ngữ số nhiều thì động từ giữ nguyên thể. Số nhiều nằm ở danh từ, không nằm ở động từ."
      },
      {
        "name": "Danh từ không đếm được",
        "sample": "The information you sent me {was} very useful.",
        "note": "information, advice, news, furniture không có dạng số nhiều nên luôn kéo theo động từ số ít."
      },
      {
        "name": "Cụm giới từ xen giữa chủ ngữ",
        "sample": "The box of chocolates {is} on the top shelf.",
        "note": "Chủ ngữ thật là the box, còn of chocolates chỉ bổ nghĩa. Bỏ cụm đó đi câu vẫn đứng được."
      },
      {
        "name": "each, every, everyone",
        "sample": "Everyone in my class {has} a bicycle.",
        "note": "Những từ này nói về nhiều người nhưng ngữ pháp xếp vào số ít, nên động từ cũng số ít."
      },
      {
        "name": "Khuôn there is và there are",
        "sample": "There {is} a bank on this street and there {are} two cafes beside it.",
        "note": "Danh từ đứng sau quyết định dạng động từ, vì there chỉ là chủ ngữ hình thức."
      },
      {
        "name": "either… or và neither… nor",
        "sample": "Neither my brothers nor my father {likes} football.",
        "note": "Đây là trường hợp duy nhất được chia theo danh từ gần động từ nhất, ở đây là my father."
      },
      {
        "name": "Danh từ tập hợp chỉ nhóm người",
        "sample": "The police {are} looking for the driver of the blue car.",
        "note": "police, people, staff không thêm -s nhưng luôn được hiểu là nhiều người nên đi với động từ số nhiều."
      },
      {
        "name": "a number of và the number of",
        "sample": "A number of students {were} absent, but the number of absences {is} falling.",
        "note": "a number of nghĩa là một số, kéo theo số nhiều. the number of nói về chính con số nên số ít."
      }
    ],
    "traps": [
      {
        "wrong": "My brother work in a bank.",
        "right": "My brother works in a bank.",
        "why": "Tiếng Việt nói “anh trai tôi làm ở ngân hàng”, động từ giữ nguyên với mọi chủ ngữ, nên bước thêm -s ngôi thứ ba bị bỏ hẳn."
      },
      {
        "wrong": "My sister very tall.",
        "right": "My sister is very tall.",
        "why": "Trước tính từ, tiếng Việt không cần chữ “là” nên câu tiếng Anh hay rơi mất động từ to be."
      },
      {
        "wrong": "The box of chocolates are on the table.",
        "right": "The box of chocolates is on the table.",
        "why": "Người học nhìn thấy chocolates ngay trước động từ nên chia theo nó, trong khi chủ ngữ thật là the box."
      },
      {
        "wrong": "There is many people in the room.",
        "right": "There are many people in the room.",
        "why": "Trong khuôn there, danh từ đứng sau mới quyết định dạng động từ. Người Việt quen mở đầu bằng “có” nên bỏ qua bước đếm."
      },
      {
        "wrong": "Everyone in my class have a bicycle.",
        "right": "Everyone in my class has a bicycle.",
        "why": "everyone nghe như nhiều người nhưng ngữ pháp tiếng Anh xếp vào số ít, khác hẳn cảm giác của tiếng Việt."
      },
      {
        "wrong": "The police is looking for him.",
        "right": "The police are looking for him.",
        "why": "police không có đuôi -s nên trông như số ít, nhưng tiếng Anh luôn hiểu đó là nhiều người."
      },
      {
        "wrong": "Neither my parents nor my sister like coffee.",
        "right": "Neither my parents nor my sister likes coffee.",
        "why": "Với neither… nor, động từ theo danh từ đứng gần nó nhất là my sister, chứ không theo cụm dài phía trước."
      }
    ],
    "compare": {
      "with": "Chia động từ theo danh từ gần nhất",
      "rows": [
        {
          "key": "Căn cứ để chia động từ",
          "other": "Danh từ nằm ngay trước động từ",
          "self": "Chủ ngữ chính của câu, dù đứng cách xa động từ"
        },
        {
          "key": "Cụm giới từ xen giữa",
          "other": "Bị tính luôn là chủ ngữ",
          "self": "Chỉ là phần bổ nghĩa, che đi thì câu vẫn đủ"
        },
        {
          "key": "Ví dụ đối chiếu",
          "other": "The box of chocolates are on the table.",
          "self": "The box of chocolates is on the table."
        },
        {
          "key": "Khi nào được lấy theo danh từ gần",
          "other": "Áp dụng cho mọi câu",
          "self": "Chỉ đúng với either… or và neither… nor"
        },
        {
          "key": "Khuôn there",
          "other": "There is two cafes near here.",
          "self": "There are two cafes near here."
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Đọc tới đâu chia tới đó, vì động từ tiếng Việt không đổi dạng",
          "self": "Tìm chủ ngữ chính trước, xem số ít hay số nhiều, rồi mới chọn dạng động từ"
        }
      ]
    },
    "items": [
      {
        "id": "subject-verb-1",
        "kind": "cloze",
        "prompt": "My brother ___ in a bank in the city centre. ",
        "answers": [
          "works"
        ],
        "cue": "work",
        "explain": "Chủ ngữ thay được bằng he nên động từ phải mang đuôi ở hiện tại đơn.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-2",
        "kind": "cloze",
        "prompt": "My cousins ___ in Da Nang with my aunt. ",
        "answers": [
          "live"
        ],
        "cue": "live",
        "explain": "Chủ ngữ chỉ nhiều người nên động từ giữ nguyên thể, dấu số nhiều đã nằm ở danh từ.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-3",
        "kind": "mcq",
        "prompt": "She ___ the news every evening.",
        "answers": [
          "watches"
        ],
        "options": [
          "watches",
          "watch",
          "watchs",
          "is watch"
        ],
        "explain": "Động từ tận cùng bằng -ch nhận thêm -es chứ không chỉ thêm -s.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-4",
        "kind": "correct",
        "prompt": "My father go to the gym three times a week.",
        "answers": [
          "goes"
        ],
        "tokens": [
          "My",
          "father",
          "go",
          "to",
          "the",
          "gym",
          "three",
          "times",
          "a",
          "week."
        ],
        "errIndex": 2,
        "explain": "Một người ở ngôi thứ ba kéo theo dạng có đuôi của động từ.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-5",
        "kind": "cloze",
        "prompt": "My sister ___ very tall for her age. ",
        "answers": [
          "is"
        ],
        "cue": "be",
        "explain": "Trước tính từ tiếng Anh vẫn cần to be, dù tiếng Việt bỏ trống chỗ này.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-6",
        "kind": "mcq",
        "prompt": "The keys ___ on the kitchen table.",
        "answers": [
          "are"
        ],
        "options": [
          "are",
          "is",
          "be",
          "was"
        ],
        "explain": "Chủ ngữ gồm nhiều chiếc chìa khóa nên động từ to be ở dạng số nhiều, hiện tại.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-7",
        "kind": "correct",
        "prompt": "My parents is both English teachers.",
        "answers": [
          "are"
        ],
        "tokens": [
          "My",
          "parents",
          "is",
          "both",
          "English",
          "teachers."
        ],
        "errIndex": 2,
        "explain": "Chủ ngữ chỉ hai người nên không dùng dạng số ít của to be.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-8",
        "kind": "cloze",
        "prompt": "The information you sent me ___ very useful. ",
        "answers": [
          "was"
        ],
        "cue": "be",
        "explain": "information không đếm được, không có dạng số nhiều nên luôn đi với động từ số ít.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-9",
        "kind": "mcq",
        "prompt": "The news about the flood ___ very sad.",
        "answers": [
          "was"
        ],
        "options": [
          "was",
          "were",
          "are",
          "have been"
        ],
        "explain": "news có đuôi -s nhưng vẫn là danh từ không đếm được, không phải số nhiều.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-10",
        "kind": "correct",
        "prompt": "Her advice were really helpful.",
        "answers": [
          "was"
        ],
        "tokens": [
          "Her",
          "advice",
          "were",
          "really",
          "helpful."
        ],
        "errIndex": 2,
        "explain": "advice thuộc nhóm không đếm được nên không bao giờ đi với dạng số nhiều.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-11",
        "kind": "cloze",
        "prompt": "The box of chocolates ___ on the top shelf. ",
        "answers": [
          "is"
        ],
        "cue": "be",
        "explain": "Chủ ngữ chính là the box, cụm of chocolates chỉ nói rõ trong hộp có gì.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-12",
        "kind": "mcq",
        "prompt": "The price of these shoes ___ too high.",
        "answers": [
          "is"
        ],
        "options": [
          "is",
          "are",
          "were",
          "have"
        ],
        "explain": "Cái đắt ở đây là the price, còn these shoes chỉ nằm trong phần bổ nghĩa.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-13",
        "kind": "correct",
        "prompt": "One of my friends live in Ha Noi.",
        "answers": [
          "lives"
        ],
        "tokens": [
          "One",
          "of",
          "my",
          "friends",
          "live",
          "in",
          "Ha",
          "Noi."
        ],
        "errIndex": 4,
        "explain": "Chủ ngữ là one, còn of my friends chỉ cho biết một trong số những ai.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-14",
        "kind": "cloze",
        "prompt": "The teacher, together with her students, ___ waiting outside. ",
        "answers": [
          "was"
        ],
        "cue": "be",
        "explain": "Cụm together with không nhập vào chủ ngữ, câu vẫn chỉ nói về một người.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-15",
        "kind": "cloze",
        "prompt": "Every student in the class ___ a locker. ",
        "answers": [
          "has"
        ],
        "cue": "have",
        "explain": "Sau every luôn là danh từ số ít nên động từ cũng ở dạng số ít.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-16",
        "kind": "mcq",
        "prompt": "Each of the rooms ___ its own bathroom.",
        "answers": [
          "has"
        ],
        "options": [
          "has",
          "have",
          "are",
          "were having"
        ],
        "explain": "Chủ ngữ là each, xét từng phòng một chứ không gộp cả nhóm.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-17",
        "kind": "correct",
        "prompt": "Everybody in the office know about the new rule.",
        "answers": [
          "knows"
        ],
        "tokens": [
          "Everybody",
          "in",
          "the",
          "office",
          "know",
          "about",
          "the",
          "new",
          "rule."
        ],
        "errIndex": 4,
        "explain": "everybody nói về nhiều người nhưng ngữ pháp xếp vào số ít.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-18",
        "kind": "cloze",
        "prompt": "There ___ a small bank at the end of this street. ",
        "answers": [
          "is"
        ],
        "cue": "be",
        "explain": "Danh từ đứng sau khuôn there chỉ một ngân hàng nên động từ ở dạng số ít.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-19",
        "kind": "mcq",
        "prompt": "There ___ two cafes next to my house.",
        "answers": [
          "are"
        ],
        "options": [
          "are",
          "is",
          "have",
          "was"
        ],
        "explain": "Trong khuôn there, danh từ phía sau mới quyết định dạng động từ.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-20",
        "kind": "cloze",
        "prompt": "Neither my brothers nor my father ___ football. ",
        "answers": [
          "likes"
        ],
        "cue": "like",
        "explain": "Với neither… nor, động từ bám vào danh từ đứng gần nó nhất là my father.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-21",
        "kind": "mcq",
        "prompt": "Either the students or the teacher ___ to lock the door.",
        "answers": [
          "has"
        ],
        "options": [
          "has",
          "have",
          "are",
          "were"
        ],
        "explain": "Danh từ sát động từ là the teacher, chỉ một người.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-22",
        "kind": "correct",
        "prompt": "Neither the teacher nor the students was happy with the result.",
        "answers": [
          "were"
        ],
        "tokens": [
          "Neither",
          "the",
          "teacher",
          "nor",
          "the",
          "students",
          "was",
          "happy",
          "with",
          "the",
          "result."
        ],
        "errIndex": 6,
        "explain": "Lần này danh từ gần động từ nhất là the students nên phải chia số nhiều.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-23",
        "kind": "cloze",
        "prompt": "The police ___ looking for the driver of the blue car. ",
        "answers": [
          "are"
        ],
        "cue": "be",
        "explain": "police không có đuôi -s nhưng tiếng Anh luôn hiểu đó là nhiều người.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-24",
        "kind": "mcq",
        "prompt": "A number of students ___ absent yesterday.",
        "answers": [
          "were"
        ],
        "options": [
          "were",
          "was",
          "is",
          "has"
        ],
        "explain": "a number of nghĩa là một số, phần trọng tâm nằm ở students nên động từ chia số nhiều.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-25",
        "kind": "correct",
        "prompt": "The number of tourists have increased this year.",
        "answers": [
          "has"
        ],
        "tokens": [
          "The",
          "number",
          "of",
          "tourists",
          "have",
          "increased",
          "this",
          "year."
        ],
        "errIndex": 4,
        "explain": "the number of nói về chính con số, chỉ là một con số nên động từ ở dạng số ít.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-26",
        "kind": "transform",
        "prompt": "My brother is a teacher. My sister is a teacher too.",
        "answers": [
          "My brother and my sister are teachers."
        ],
        "explain": "Hai chủ ngữ nối bằng and gộp thành số nhiều nên dạng của to be đổi theo.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-27",
        "kind": "transform",
        "prompt": "This street has two small cafes.",
        "answers": [
          "There are two small cafes on this street."
        ],
        "explain": "Chuyển sang khuôn there thì động từ bám vào danh từ đứng ngay sau nó.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-28",
        "kind": "transform",
        "prompt": "All the students in the class have a laptop.",
        "answers": [
          "Every student in the class has a laptop."
        ],
        "explain": "every kéo cả danh từ lẫn động từ về dạng số ít.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-29",
        "kind": "transform",
        "prompt": "My father does not like coffee and my mother does not like it either.",
        "answers": [
          "Neither my father nor my mother likes coffee."
        ],
        "explain": "Trong khuôn neither… nor, động từ theo danh từ gần nhất là my mother.",
        "errorTag": "Thiếu -s ngôi 3"
      },
      {
        "id": "subject-verb-30",
        "kind": "transform",
        "prompt": "Both my brothers work in Ha Noi.",
        "answers": [
          "Each of my brothers works in Ha Noi."
        ],
        "explain": "Đổi both sang each là xét từng người một, nên động từ phải nhận thêm đuôi.",
        "errorTag": "Thiếu -s ngôi 3"
      }
    ]
  },
  {
    "key": "question-forms",
    "builtin": true,
    "name": "Câu hỏi đuôi & câu hỏi gián tiếp",
    "nameEn": "Question tags and indirect questions",
    "level": "A2",
    "group": "Trật tự từ & nhấn mạnh",
    "description": "Hai cách hỏi mềm hơn câu hỏi thẳng: gắn thêm đuôi để xác nhận, hoặc lồng câu hỏi vào một lời mở đầu lịch sự. Tiếng Việt chỉ có một chữ “phải không” cho mọi câu và không có bước đảo trợ động từ, nên người học quên đảo dấu ở đuôi và lại bê nguyên trật tự đảo vào câu gián tiếp.",
    "icon": "shuffle",
    "tags": [
      "Trật tự từ"
    ],
    "signals": [
      "isn't it",
      "aren't I",
      "shall we",
      "will you",
      "do you know",
      "could you tell me",
      "I wonder",
      "if",
      "whether",
      "never"
    ],
    "formulas": [
      {
        "form": "Vế đầu khẳng định — đuôi phủ định",
        "structure": "S + V…, trợ động từ + not + đại từ?",
        "example": "You are from Ha Noi, aren't you?"
      },
      {
        "form": "Vế đầu phủ định — đuôi khẳng định",
        "structure": "S + V + not…, trợ động từ + đại từ?",
        "example": "She doesn't drink coffee, does she?"
      },
      {
        "form": "Câu không sẵn trợ động từ",
        "structure": "S + V…, do / does / did (+ not) + đại từ?",
        "example": "He works at the bank, doesn't he?"
      },
      {
        "form": "Các đuôi đặc biệt",
        "structure": "I am…, aren't I? · Let's…, shall we? · Mệnh lệnh…, will you?",
        "example": "Let's take a taxi, shall we?"
      },
      {
        "form": "Câu hỏi gián tiếp dạng Wh",
        "structure": "Do you know + từ hỏi + S + V?",
        "example": "Do you know where the station is?"
      },
      {
        "form": "Câu hỏi gián tiếp dạng Yes-No",
        "structure": "Could you tell me + if / whether + S + V?",
        "example": "Could you tell me if the shop is open?"
      }
    ],
    "uses": [
      {
        "name": "Xác nhận điều mình đang tin là đúng",
        "sample": "You are from Ha Noi, {aren't you}?",
        "note": "Vế đầu khẳng định nên đuôi phải mang not, và trợ động từ được lấy lại đúng từ are."
      },
      {
        "name": "Vế đầu đã ở dạng phủ định",
        "sample": "She doesn't drink coffee, {does she}?",
        "note": "Đuôi luôn ngược dấu với vế đầu, nên chỗ này bỏ not đi."
      },
      {
        "name": "Câu chỉ có động từ thường",
        "sample": "He works at the bank, {doesn't he}?",
        "note": "Hiện tại đơn ngôi thứ ba không sẵn trợ động từ nên phải mượn does cho phần đuôi."
      },
      {
        "name": "Chủ ngữ I đi với am",
        "sample": "I'm late again, {aren't I}?",
        "note": "Đây là khuôn cố định, tiếng Anh không có dạng amn't."
      },
      {
        "name": "Rủ rê và sai bảo",
        "sample": "{Let's} go for a walk, {shall we}?",
        "note": "Câu rủ luôn đi với shall we, còn câu mệnh lệnh thì dùng will you cho nhẹ giọng."
      },
      {
        "name": "Câu mở đầu bằng there",
        "sample": "There is a bus stop near here, {isn't there}?",
        "note": "there đóng vai chủ ngữ nên được nhắc lại nguyên si ở đuôi, không đổi thành it."
      },
      {
        "name": "Câu đã mang sẵn nghĩa phủ định",
        "sample": "He {never} arrives on time, does he?",
        "note": "never, hardly, seldom được tính là phủ định rồi nên đuôi trở về dạng khẳng định."
      },
      {
        "name": "Hỏi lịch sự bằng câu hỏi gián tiếp",
        "sample": "Do you know where {the station is}?",
        "note": "Sau từ hỏi, trật tự quay về chủ ngữ rồi mới tới động từ, đúng như một câu kể."
      },
      {
        "name": "Lồng một câu hỏi Yes-No vào",
        "sample": "Could you tell me {if} the shop opens at nine?",
        "note": "Câu hỏi có hay không cần if hoặc whether làm cầu nối, và bỏ luôn do, does, did."
      }
    ],
    "traps": [
      {
        "wrong": "You are a student, are you?",
        "right": "You are a student, aren't you?",
        "why": "Tiếng Việt gắn “phải không” vào câu nào cũng được nên bước đảo dấu ở đuôi bị bỏ qua."
      },
      {
        "wrong": "She doesn't like fish, doesn't she?",
        "right": "She doesn't like fish, does she?",
        "why": "Vế đầu đã phủ định thì đuôi phải khẳng định. Người học lặp lại y nguyên vì tiếng Việt không có luật ngược dấu."
      },
      {
        "wrong": "I'm late, amn't I?",
        "right": "I'm late, aren't I?",
        "why": "Tiếng Anh không có dạng rút gọn amn't, khuôn cố định của ngôi I là aren't I."
      },
      {
        "wrong": "Let's go out tonight, will we?",
        "right": "Let's go out tonight, shall we?",
        "why": "Câu rủ mở đầu bằng Let's luôn khép lại bằng shall we, đây là cặp cố định phải nhớ nguyên cụm."
      },
      {
        "wrong": "Do you know where is the station?",
        "right": "Do you know where the station is?",
        "why": "Câu hỏi đã nằm trong lòng câu khác thì không đảo nữa. Người Việt quen mẫu hỏi thẳng nên bê luôn trật tự đảo vào."
      },
      {
        "wrong": "Could you tell me what time does the shop open?",
        "right": "Could you tell me what time the shop opens?",
        "why": "Phải bỏ does và trả đuôi -s về cho động từ chính, vì phần sau đã thành một mệnh đề kể."
      },
      {
        "wrong": "Do you know is he coming?",
        "right": "Do you know if he is coming?",
        "why": "Câu hỏi nằm trong câu khác thì giữ trật tự S-V và cần if hoặc whether nối vào. Người học bê nguyên trật tự đảo của câu hỏi trực tiếp."
      }
    ],
    "compare": {
      "with": "Câu hỏi trực tiếp",
      "rows": [
        {
          "key": "Trật tự trong mệnh đề hỏi",
          "other": "Đảo trợ động từ lên trước chủ ngữ",
          "self": "Giữ nguyên chủ ngữ đứng trước động từ"
        },
        {
          "key": "Trợ động từ do, does, did",
          "other": "Bắt buộc có: Where does he live?",
          "self": "Bỏ đi và trả đuôi về động từ chính: Do you know where he lives?"
        },
        {
          "key": "Câu hỏi Yes-No",
          "other": "Mở đầu bằng trợ động từ: Is the shop open?",
          "self": "Nối bằng if hoặc whether: Could you tell me if the shop is open?"
        },
        {
          "key": "Sắc thái",
          "other": "Hỏi thẳng, trung tính",
          "self": "Nhẹ và lịch sự hơn, hoặc chỉ để xác nhận điều đã đoán"
        },
        {
          "key": "Phần cuối câu",
          "other": "Không có gì thêm sau động từ chính",
          "self": "Câu hỏi đuôi thêm một trợ động từ đảo dấu kèm đại từ"
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Bê nguyên trật tự đảo vào sau do you know",
          "self": "Dịch “phải không” thành một đuôi cố định, quên đảo dấu và quên đổi trợ động từ"
        }
      ]
    },
    "items": [
      {
        "id": "question-forms-1",
        "kind": "cloze",
        "prompt": "You are from Ha Noi, ___?",
        "answers": [
          "aren't you"
        ],
        "explain": "Vế đầu khẳng định nên đuôi mang not, và trợ động từ lấy lại đúng từ are.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-2",
        "kind": "mcq",
        "prompt": "She is a nurse, ___?",
        "answers": [
          "isn't she"
        ],
        "options": [
          "isn't she",
          "is she",
          "doesn't she",
          "isn't it"
        ],
        "explain": "Đuôi lấy lại is của vế đầu, và đại từ thay cho a nurse là she chứ không phải it.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-3",
        "kind": "cloze",
        "prompt": "They aren't ready yet, ___?",
        "answers": [
          "are they"
        ],
        "explain": "Vế đầu đã có not nên phần đuôi quay về dạng khẳng định.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-4",
        "kind": "cloze",
        "prompt": "You live near the market, ___?",
        "answers": [
          "don't you"
        ],
        "explain": "Đuôi luôn ngược dấu với vế đầu, mà vế đầu ở đây không có phủ định.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-5",
        "kind": "mcq",
        "prompt": "He works at the bank, ___?",
        "answers": [
          "doesn't he"
        ],
        "options": [
          "doesn't he",
          "isn't he",
          "doesn't it",
          "don't he"
        ],
        "explain": "Câu chỉ có động từ thường nên phải mượn does, và chủ ngữ ngôi thứ ba số ít giữ nguyên dạng đó.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-6",
        "kind": "cloze",
        "prompt": "Your sister doesn't eat meat, ___?",
        "answers": [
          "does she"
        ],
        "explain": "Trợ động từ đã có sẵn ở vế đầu, phần đuôi chỉ việc bỏ not.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-7",
        "kind": "cloze",
        "prompt": "They went to Da Lat last year, ___?",
        "answers": [
          "didn't they"
        ],
        "explain": "Đuôi phải cùng thì với vế đầu, mà vế đầu đang kể chuyện năm ngoái.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-8",
        "kind": "mcq",
        "prompt": "You can drive a car, ___?",
        "answers": [
          "can't you"
        ],
        "options": [
          "can't you",
          "don't you",
          "can you",
          "aren't you"
        ],
        "explain": "Đã có động từ khuyết thiếu ở vế đầu thì đuôi dùng lại chính nó, không mượn do.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-9",
        "kind": "cloze",
        "prompt": "We have met before, ___?",
        "answers": [
          "haven't we"
        ],
        "explain": "have ở đây là trợ động từ của thì hoàn thành nên được lấy lại nguyên si.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-10",
        "kind": "cloze",
        "prompt": "Nam and Lan are coming with us, ___?",
        "answers": [
          "aren't they"
        ],
        "explain": "Phần đuôi luôn dùng đại từ, không nhắc lại tên riêng.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-11",
        "kind": "cloze",
        "prompt": "I'm late again, ___?",
        "answers": [
          "aren't I"
        ],
        "explain": "Tiếng Anh không có dạng amn't nên ngôi I mượn khuôn cố định này.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-12",
        "kind": "mcq",
        "prompt": "Let's take a taxi, ___?",
        "answers": [
          "shall we"
        ],
        "options": [
          "shall we",
          "will we",
          "do we",
          "shall us"
        ],
        "explain": "Câu rủ mở đầu bằng Let's luôn khép lại bằng cặp cố định đi kèm.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-13",
        "kind": "cloze",
        "prompt": "Open the window, ___?",
        "answers": [
          "will you"
        ],
        "explain": "Câu mệnh lệnh không có chủ ngữ nên phần đuôi dùng khuôn riêng để hạ giọng thành lời nhờ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-14",
        "kind": "cloze",
        "prompt": "There is a bus stop near here, ___?",
        "answers": [
          "isn't there"
        ],
        "explain": "there đóng vai chủ ngữ nên được nhắc lại y nguyên, không đổi thành it.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-15",
        "kind": "mcq",
        "prompt": "There were a lot of people at the show, ___?",
        "answers": [
          "weren't there"
        ],
        "options": [
          "weren't there",
          "weren't they",
          "wasn't there",
          "didn't they"
        ],
        "explain": "Chủ ngữ hình thức giữ nguyên, còn động từ ở vế đầu chỉ việc đảo dấu.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-16",
        "kind": "cloze",
        "prompt": "He never arrives on time, ___?",
        "answers": [
          "does he"
        ],
        "explain": "never đã mang sẵn nghĩa phủ định nên đuôi không thêm not nữa.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-17",
        "kind": "cloze",
        "prompt": "She hardly ever cooks at home, ___?",
        "answers": [
          "does she"
        ],
        "explain": "hardly ever được tính là một phủ định, nên vế đuôi phải ở dạng khẳng định.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-18",
        "kind": "cloze",
        "prompt": "Do you know where the station ___? ",
        "answers": [
          "is"
        ],
        "cue": "be",
        "explain": "Câu hỏi đã nằm trong lòng câu khác nên chủ ngữ đứng trước động từ như một lời kể.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-19",
        "kind": "mcq",
        "prompt": "Could you tell me where ___?",
        "answers": [
          "the toilets are"
        ],
        "options": [
          "the toilets are",
          "are the toilets",
          "is the toilets",
          "do the toilets be"
        ],
        "explain": "Sau từ hỏi, trật tự quay về chủ ngữ rồi mới tới động từ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-20",
        "kind": "cloze",
        "prompt": "Do you know what time ___?",
        "answers": [
          "the shop opens"
        ],
        "explain": "Bỏ trợ động từ đi thì đuôi -s phải quay về với động từ chính.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-21",
        "kind": "cloze",
        "prompt": "I wonder why he ___ to the meeting yesterday. ",
        "answers": [
          "didn't come"
        ],
        "cue": "not come",
        "explain": "Mệnh đề sau why giữ trật tự của câu kể, không đảo did lên trước chủ ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-22",
        "kind": "mcq",
        "prompt": "Can you tell me how much ___?",
        "answers": [
          "this jacket costs"
        ],
        "options": [
          "this jacket costs",
          "does this jacket cost",
          "costs this jacket",
          "this jacket cost"
        ],
        "explain": "Trật tự giữ nguyên như câu kể, và động từ vẫn phải hợp với chủ ngữ số ít.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-23",
        "kind": "cloze",
        "prompt": "Could you tell me ___ the shop opens at nine?",
        "answers": [
          "if"
        ],
        "explain": "Câu gốc là câu hỏi có hay không nên cần một từ nối để lồng vào.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-24",
        "kind": "mcq",
        "prompt": "Could you tell me ___?",
        "answers": [
          "whether the museum is open"
        ],
        "options": [
          "whether the museum is open",
          "whether is the museum open",
          "whether the museum open",
          "if or not the museum is open"
        ],
        "explain": "whether đứng trước một mệnh đề đầy đủ và không kéo theo bước đảo.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-25",
        "kind": "cloze",
        "prompt": "I don't know ___.",
        "answers": [
          "whether he is coming"
        ],
        "explain": "Khi câu hỏi lồng vào một lời kể thì bỏ đảo ngữ và thay bằng whether.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-26",
        "kind": "transform",
        "prompt": "Where is the post office?",
        "answers": [
          "Could you tell me where the post office is?"
        ],
        "explain": "Chuyển sang khuôn lịch sự thì chủ ngữ trả về đứng trước động từ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-27",
        "kind": "transform",
        "prompt": "What time does the museum open?",
        "answers": [
          "Do you know what time the museum opens?"
        ],
        "explain": "Bỏ trợ động từ và trả đuôi -s về cho động từ chính.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-28",
        "kind": "transform",
        "prompt": "Is this seat free?",
        "answers": [
          "Could you tell me if this seat is free?"
        ],
        "explain": "Câu hỏi Yes-No cần một từ nối, đồng thời gỡ bỏ phần đảo ở đầu câu.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-29",
        "kind": "transform",
        "prompt": "Why did she leave so early? I have no idea.",
        "answers": [
          "I have no idea why she left so early."
        ],
        "explain": "Mệnh đề hỏi lồng vào câu kể thì bỏ did và chuyển dấu quá khứ sang động từ chính.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "question-forms-30",
        "kind": "transform",
        "prompt": "I am sure she does not eat meat, but I want to check.",
        "answers": [
          "She does not eat meat, does she?"
        ],
        "explain": "Muốn xác nhận một điều mình đã đoán thì gắn đuôi ngược dấu với vế đầu.",
        "errorTag": "Trật tự từ"
      }
    ]
  },
  {
    "key": "prepositions",
    "builtin": true,
    "name": "Giới từ thời gian & nơi chốn",
    "nameEn": "Prepositions of time and place",
    "level": "A2",
    "group": "Động từ & cấu trúc",
    "description": "Chọn in, on hay at theo loại thời gian và loại không gian đứng sau. Tiếng Việt gom tất cả vào mấy chữ “ở, vào, trong” nên người học dịch thẳng rồi chọn nhầm, và hay thêm giới từ vào những chỗ tiếng Anh để trống.",
    "icon": "target",
    "tags": [
      "Giới từ"
    ],
    "signals": [
      "in",
      "on",
      "at",
      "by",
      "until",
      "for",
      "since",
      "during",
      "arrive in",
      "arrive at"
    ],
    "formulas": [
      {
        "form": "in — khoảng thời gian dài",
        "structure": "in + năm / tháng / mùa / buổi trong ngày",
        "example": "My sister was born in March 2001."
      },
      {
        "form": "on — ngày cụ thể",
        "structure": "on + thứ / ngày / ngày lễ",
        "example": "We have an English test on Monday."
      },
      {
        "form": "at — một điểm thời gian",
        "structure": "at + giờ, at night, at the weekend",
        "example": "The film starts at seven thirty."
      },
      {
        "form": "in — không gian bao quanh",
        "structure": "in + phòng, thành phố, quốc gia",
        "example": "My brother lives in Hue."
      },
      {
        "form": "on — bề mặt hoặc tuyến đường",
        "structure": "on + mặt phẳng, tầng, tên phố",
        "example": "Your keys are on the kitchen table."
      },
      {
        "form": "at — một điểm trên bản đồ",
        "structure": "at + địa chỉ, at home, at school, at the bus stop",
        "example": "I will wait for you at the bus stop."
      },
      {
        "form": "Không dùng giới từ",
        "structure": "next / last / this / every + thời gian, và home",
        "example": "I will visit my grandparents next week."
      }
    ],
    "uses": [
      {
        "name": "Năm, tháng và mùa",
        "sample": "My sister was born {in} March 2001.",
        "note": "Tháng và năm là những khoảng dài ôm trọn nhiều ngày nên đi với in."
      },
      {
        "name": "Ngày và thứ trong tuần",
        "sample": "We have an English test {on} Monday.",
        "note": "Một ngày cụ thể được hình dung như một mốc trên lịch nên đi với on."
      },
      {
        "name": "Giờ giấc",
        "sample": "The film starts {at} seven thirty.",
        "note": "Giờ là một điểm chính xác trên đồng hồ, hẹp nhất trong ba loại nên dùng at."
      },
      {
        "name": "Các buổi trong ngày",
        "sample": "I read {in} the morning but I never study {at} night.",
        "note": "Các buổi dùng in, riêng at night là cụm cố định phải nhớ nguyên cụm."
      },
      {
        "name": "Buổi gắn với một ngày cụ thể",
        "sample": "The meeting is {on} Monday morning.",
        "note": "Khi buổi dính vào một ngày xác định thì cả cụm chuyển sang on, không còn dùng in nữa."
      },
      {
        "name": "Ba mức không gian rộng, phẳng, hẹp",
        "sample": "She lives {in} Hue, {on} Tran Phu Street, {at} number 25.",
        "note": "Xếp từ rộng tới hẹp: vùng bao quanh, mặt đường, rồi một điểm cụ thể."
      },
      {
        "name": "in the corner và at the corner",
        "sample": "The lamp is {in} the corner of the room, and the bakery is {at} the corner of the street.",
        "note": "Góc bên trong một không gian dùng in, còn chỗ hai con phố cắt nhau dùng at."
      },
      {
        "name": "Hạn chót và mốc kéo dài",
        "sample": "Please send the report {by} Friday and stay online {until} five.",
        "note": "by là hạn muộn nhất, xong sớm hơn vẫn được. until là kéo dài liên tục cho tới mốc đó."
      },
      {
        "name": "Những chỗ tiếng Anh để trống",
        "sample": "I will visit my grandparents {next week} and I go {home} at six every day.",
        "note": "Các cụm next, last, this, every và từ home đã tự nói rõ nghĩa, thêm giới từ là thừa."
      }
    ],
    "traps": [
      {
        "wrong": "I was born in 15 May.",
        "right": "I was born on 15 May.",
        "why": "Tiếng Việt nói “vào ngày 15 tháng 5”, một chữ “vào” cho cả ngày lẫn tháng, nên người học dùng luôn in cho ngày."
      },
      {
        "wrong": "See you in Monday morning.",
        "right": "See you on Monday morning.",
        "why": "Buổi sáng đứng một mình thì in the morning, nhưng khi gắn với một ngày cụ thể thì cả cụm chuyển sang on."
      },
      {
        "wrong": "I will go home in next week.",
        "right": "I will go home next week.",
        "why": "Cụm next week đã tự chỉ rõ thời gian. Người Việt luôn nói “vào tuần sau” nên hay thêm một giới từ không cần thiết."
      },
      {
        "wrong": "We arrived to Ha Noi at six.",
        "right": "We arrived in Ha Noi at six.",
        "why": "arrive không bao giờ đi với to. Thành phố và quốc gia dùng arrive in, còn sân bay hay nhà ga dùng arrive at."
      },
      {
        "wrong": "I go to home after work.",
        "right": "I go home after work.",
        "why": "home trong nghĩa về nhà đã bao gồm luôn hướng đi, thêm to là thừa dù tiếng Việt vẫn nói “về nhà”."
      },
      {
        "wrong": "She has worked here since three years.",
        "right": "She has worked here for three years.",
        "why": "Tiếng Việt nói “từ ba năm nay” nên chữ “từ” kéo người học chọn since, trong khi con số chỉ độ dài phải đi với for."
      },
      {
        "wrong": "During two hours I waited for him.",
        "right": "I waited for him for two hours.",
        "why": "during đứng trước một sự kiện có tên như the meeting, còn độ dài đo bằng con số thì dùng for."
      }
    ],
    "compare": {
      "with": "Giới từ dịch thẳng từ tiếng Việt",
      "rows": [
        {
          "key": "Cách chọn giới từ",
          "other": "Dịch “ở, vào, trong” rồi tìm một từ tiếng Anh tương ứng",
          "self": "Nhìn loại thời gian hay loại không gian đứng sau rồi mới chọn"
        },
        {
          "key": "Chữ “vào” của tiếng Việt",
          "other": "Một chữ dùng chung cho vào thứ hai, vào tháng ba, vào bảy giờ",
          "self": "Ba giới từ khác nhau: on Monday, in March, at seven"
        },
        {
          "key": "Chữ “ở” của tiếng Việt",
          "other": "Một chữ dùng chung cho ở Huế, ở trên bàn, ở bến xe",
          "self": "in Hue, on the table, at the bus stop"
        },
        {
          "key": "Cụm cố định",
          "other": "Suy từ nghĩa nên đoán sai: in night, in home",
          "self": "Nhớ nguyên cụm: at night, at home, on time, in time"
        },
        {
          "key": "Chỗ không cần giới từ",
          "other": "Thêm vào cho chắc: in next week, to home",
          "self": "Để trống: next week, last year, this morning, home"
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Chọn theo nghĩa dịch chứ không theo danh từ đi sau",
          "self": "Nhớ theo cặp giới từ cộng danh từ, và nhớ cả những chỗ bỏ trống"
        }
      ]
    },
    "items": [
      {
        "id": "prepositions-1",
        "kind": "cloze",
        "prompt": "My sister was born ___ March 2001.",
        "answers": [
          "in"
        ],
        "explain": "Tháng và năm là khoảng thời gian dài nên đi với giới từ chỉ vùng bao quanh.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-2",
        "kind": "mcq",
        "prompt": "We have an English test ___ Monday.",
        "answers": [
          "on"
        ],
        "options": [
          "on",
          "in",
          "at",
          "of"
        ],
        "explain": "Thứ trong tuần là một ngày xác định trên lịch.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-3",
        "kind": "cloze",
        "prompt": "The film starts ___ seven thirty.",
        "answers": [
          "at"
        ],
        "explain": "Giờ giấc là một điểm chính xác nên dùng giới từ hẹp nhất trong ba từ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-4",
        "kind": "correct",
        "prompt": "I always feel sleepy on the afternoon.",
        "answers": [
          "in"
        ],
        "tokens": [
          "I",
          "always",
          "feel",
          "sleepy",
          "on",
          "the",
          "afternoon."
        ],
        "errIndex": 4,
        "explain": "Các buổi trong ngày được coi là một khoảng dài, không phải một điểm.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-5",
        "kind": "mcq",
        "prompt": "I never study ___ night.",
        "answers": [
          "at"
        ],
        "options": [
          "at",
          "in",
          "on",
          "by"
        ],
        "explain": "Đây là cụm cố định, không theo luật chung của các buổi trong ngày.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-6",
        "kind": "cloze",
        "prompt": "The meeting is ___ Monday morning.",
        "answers": [
          "on"
        ],
        "explain": "Buổi sáng đã dính vào một ngày cụ thể nên cả cụm theo luật của ngày.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-7",
        "kind": "mcq",
        "prompt": "The morning train almost always leaves ___.",
        "answers": [
          "on time"
        ],
        "options": [
          "on time",
          "in time",
          "at time",
          "by time"
        ],
        "explain": "Đúng giờ đã định là on time. In time mang nghĩa kịp lúc trước khi quá muộn, không hợp ở đây.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-8",
        "kind": "cloze",
        "prompt": "We got to the hospital just ___ time to see the doctor.",
        "answers": [
          "in"
        ],
        "explain": "Ý ở đây là kịp lúc, vừa vặn trước khi quá muộn.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-9",
        "kind": "cloze",
        "prompt": "Your keys are ___ the kitchen table.",
        "answers": [
          "on"
        ],
        "explain": "Mặt bàn là một bề mặt phẳng, vật nằm tiếp xúc lên trên.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-10",
        "kind": "correct",
        "prompt": "I will wait for you in the bus stop.",
        "answers": [
          "at"
        ],
        "tokens": [
          "I",
          "will",
          "wait",
          "for",
          "you",
          "in",
          "the",
          "bus",
          "stop."
        ],
        "errIndex": 5,
        "explain": "Bến xe được hình dung là một điểm hẹn chứ không phải một không gian bao quanh.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-11",
        "kind": "cloze",
        "prompt": "There is a tall lamp ___ the corner of the room.",
        "answers": [
          "in"
        ],
        "explain": "Góc nằm bên trong bốn bức tường nên dùng giới từ chỉ không gian bao quanh.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-12",
        "kind": "mcq",
        "prompt": "The bakery is ___ the corner of Le Loi Street.",
        "answers": [
          "at"
        ],
        "options": [
          "at",
          "of",
          "to",
          "over"
        ],
        "explain": "Góc phố là chỗ hai con đường gặp nhau, một điểm trên bản đồ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-13",
        "kind": "correct",
        "prompt": "My mother is in home this afternoon.",
        "answers": [
          "at"
        ],
        "tokens": [
          "My",
          "mother",
          "is",
          "in",
          "home",
          "this",
          "afternoon."
        ],
        "errIndex": 3,
        "explain": "Đây là cụm cố định chỉ vị trí, không tính theo không gian bao quanh.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-14",
        "kind": "cloze",
        "prompt": "She lives ___ Tran Phu Street, next to the post office.",
        "answers": [
          "on"
        ],
        "explain": "Tên phố được hình dung như một tuyến đường, nhà nằm dọc theo nó.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-15",
        "kind": "cloze",
        "prompt": "Please send me the report ___ Friday.",
        "answers": [
          "by"
        ],
        "explain": "Đây là hạn muộn nhất, gửi sớm hơn vẫn được.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-16",
        "kind": "mcq",
        "prompt": "The shop stays open ___ nine in the evening.",
        "answers": [
          "until"
        ],
        "options": [
          "until",
          "by",
          "since",
          "during"
        ],
        "explain": "Việc mở cửa kéo dài liên tục cho tới mốc đó rồi mới dừng.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-17",
        "kind": "correct",
        "prompt": "I have lived in Da Nang since three years.",
        "answers": [
          "for"
        ],
        "tokens": [
          "I",
          "have",
          "lived",
          "in",
          "Da",
          "Nang",
          "since",
          "three",
          "years."
        ],
        "errIndex": 6,
        "explain": "Ba năm là một độ dài đo được, không phải mốc bắt đầu.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-18",
        "kind": "cloze",
        "prompt": "I have known her ___ 2018.",
        "answers": [
          "since"
        ],
        "explain": "Năm 2018 là mốc bắt đầu, tính từ đó tới bây giờ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-19",
        "kind": "mcq",
        "prompt": "Nobody spoke ___ the meeting.",
        "answers": [
          "during"
        ],
        "options": [
          "during",
          "for",
          "while",
          "since"
        ],
        "explain": "Phía sau là tên một sự kiện có đầu có cuối, không phải con số chỉ độ dài hay một mệnh đề.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-20",
        "kind": "correct",
        "prompt": "We waited during two hours at the station.",
        "answers": [
          "for"
        ],
        "tokens": [
          "We",
          "waited",
          "during",
          "two",
          "hours",
          "at",
          "the",
          "station."
        ],
        "errIndex": 2,
        "explain": "Độ dài đo bằng con số thì không dùng từ dành cho sự kiện.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-21",
        "kind": "cloze",
        "prompt": "We arrived ___ Ha Noi at six in the morning.",
        "answers": [
          "in"
        ],
        "explain": "Thành phố là không gian bao quanh, và arrive không bao giờ đi với to.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-22",
        "kind": "mcq",
        "prompt": "They arrived ___ the airport two hours early.",
        "answers": [
          "at"
        ],
        "options": [
          "at",
          "in",
          "to",
          "on"
        ],
        "explain": "Sân bay được coi là một điểm dừng trên hành trình, không phải nơi bao quanh.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-23",
        "kind": "cloze",
        "prompt": "I go ___ straight after work.",
        "answers": [
          "home"
        ],
        "explain": "Từ home đã gồm luôn ý hướng về nên không cần thêm giới từ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-24",
        "kind": "mcq",
        "prompt": "I will visit my grandparents ___.",
        "answers": [
          "next week"
        ],
        "options": [
          "next week",
          "in next week",
          "on next week",
          "at next week"
        ],
        "explain": "Cụm mở đầu bằng next đã tự chỉ rõ thời gian, không nhận thêm giới từ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-25",
        "kind": "cloze",
        "prompt": "She moved to Ha Noi ___.",
        "answers": [
          "last year"
        ],
        "explain": "Cụm mở đầu bằng last cũng nằm trong nhóm để trống giới từ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-26",
        "kind": "transform",
        "prompt": "I started working here in 2022.",
        "answers": [
          "I have worked here since 2022."
        ],
        "explain": "Năm 2022 là mốc bắt đầu và việc vẫn kéo dài tới giờ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-27",
        "kind": "transform",
        "prompt": "I started working here three years ago.",
        "answers": [
          "I have worked here for three years."
        ],
        "explain": "Ba năm là độ dài của quãng thời gian, không phải điểm bắt đầu.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-28",
        "kind": "transform",
        "prompt": "Finish the report before Friday evening at the latest.",
        "answers": [
          "Finish the report by Friday evening."
        ],
        "explain": "Ý muộn nhất là lúc nào được gói gọn vào một giới từ chỉ hạn chót.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-29",
        "kind": "transform",
        "prompt": "We reached Ha Noi at noon.",
        "answers": [
          "We arrived in Ha Noi at noon."
        ],
        "explain": "Đổi sang arrive thì thành phố đi kèm giới từ chỉ không gian bao quanh, tuyệt đối không dùng to.",
        "errorTag": "Giới từ"
      },
      {
        "id": "prepositions-30",
        "kind": "transform",
        "prompt": "The train was not late at all.",
        "answers": [
          "The train arrived on time."
        ],
        "explain": "Ý đúng giờ như lịch đã định được diễn đạt bằng một cụm cố định.",
        "errorTag": "Giới từ"
      }
    ]
  },
  {
    "key": "comparison",
    "builtin": true,
    "name": "So sánh hơn & so sánh nhất",
    "nameEn": "Comparatives and superlatives",
    "level": "A2",
    "group": "Động từ & cấu trúc",
    "description": "Dùng để xếp hạng người và vật. Tiếng Việt chỉ thêm một chữ “hơn” hay “nhất” đứng sau tính từ, không đổi dạng tính từ và không cần mạo từ, nên người học hay quên đuôi -er, quên the, hoặc đánh dấu hai lần bằng cả more lẫn -er.",
    "icon": "trend",
    "tags": [
      "Thiếu mạo từ"
    ],
    "signals": [
      "than",
      "as … as",
      "the most",
      "the best",
      "much",
      "far",
      "a bit",
      "twice",
      "in the world",
      "of all"
    ],
    "formulas": [
      {
        "form": "So sánh hơn — tính từ ngắn",
        "structure": "S + be + adj-er + than + …",
        "example": "My brother is taller than me."
      },
      {
        "form": "So sánh hơn — tính từ dài",
        "structure": "S + be + more + adj + than + …",
        "example": "This book is more interesting than the film."
      },
      {
        "form": "So sánh nhất — tính từ ngắn",
        "structure": "S + be + the + adj-est + in / of …",
        "example": "She is the youngest student in the class."
      },
      {
        "form": "So sánh nhất — tính từ dài",
        "structure": "S + be + the most + adj + in / of …",
        "example": "That was the most expensive meal of the trip."
      },
      {
        "form": "Dạng bất quy tắc",
        "structure": "good → better → the best; bad → worse → the worst",
        "example": "Her English is better than mine."
      },
      {
        "form": "So sánh bằng",
        "structure": "S + be + as + adj + as + …",
        "example": "My bag is as heavy as yours."
      },
      {
        "form": "So sánh kép",
        "structure": "The + adj-er …, the + adj-er …",
        "example": "The more you practise, the faster you speak."
      }
    ],
    "uses": [
      {
        "name": "So hai người hoặc hai vật",
        "sample": "My brother is {taller} than me.",
        "note": "Tính từ một âm tiết chỉ cần thêm đuôi -er. Vế thứ hai bắt buộc có than."
      },
      {
        "name": "So sánh với tính từ dài",
        "sample": "This book is {more interesting} than the film.",
        "note": "Tính từ từ ba âm tiết trở lên giữ nguyên dạng và mượn more đứng trước, không có đuôi -er."
      },
      {
        "name": "Tính từ bất quy tắc",
        "sample": "Her English is {better} than mine.",
        "note": "good, bad, far, little có dạng riêng phải học thuộc. Không ghép more với chúng."
      },
      {
        "name": "Đứng đầu một nhóm",
        "sample": "She is {the youngest} student in the class.",
        "note": "Chỉ có một người đứng đầu nên trước so sánh nhất luôn có the."
      },
      {
        "name": "Đứng đầu nhóm với tính từ dài",
        "sample": "That was {the most expensive} meal of the trip.",
        "note": "Tính từ dài dùng the most. Sau đó dùng in cho một nơi chốn hay một nhóm, dùng of cho một tập hợp đã đếm được."
      },
      {
        "name": "Hai bên ngang nhau",
        "sample": "My bag is {as heavy as} yours.",
        "note": "So sánh bằng kẹp tính từ nguyên dạng giữa hai chữ as. Thiếu một chữ as là câu hỏng."
      },
      {
        "name": "Nhấn mức chênh lệch",
        "sample": "This flat is {much cheaper} than the one we saw yesterday.",
        "note": "much, far, a lot làm mức chênh lệch mạnh hơn; a bit làm nó nhẹ đi. Không dùng very ở đây."
      },
      {
        "name": "Gấp bao nhiêu lần",
        "sample": "A taxi is {twice as expensive as} the bus.",
        "note": "Số lần đặt ngay trước cả khuôn as … as: twice, three times, half."
      },
      {
        "name": "Hai mức cùng tăng",
        "sample": "{The more} you practise, the faster you speak.",
        "note": "So sánh kép cần chữ the ở đầu cả hai vế để nối hai mức tăng lại với nhau."
      }
    ],
    "traps": [
      {
        "wrong": "She is more taller than her sister.",
        "right": "She is taller than her sister.",
        "why": "Tiếng Việt chỉ có một chữ “hơn” nên người học thêm cả more lẫn -er cho yên tâm. Tiếng Anh chỉ được đánh dấu so sánh một lần."
      },
      {
        "wrong": "He is tallest boy in the class.",
        "right": "He is the tallest boy in the class.",
        "why": "Tiếng Việt nói “cao nhất lớp” không cần mạo từ. Trong tiếng Anh, so sánh nhất luôn kéo theo the vì chỉ có một đối tượng duy nhất."
      },
      {
        "wrong": "This film is interestinger than that one.",
        "right": "This film is more interesting than that one.",
        "why": "Đuôi -er chỉ dành cho tính từ ngắn. Tính từ dài phải mượn more đứng trước."
      },
      {
        "wrong": "My house is bigger from yours.",
        "right": "My house is bigger than yours.",
        "why": "Người học dịch “to hơn của bạn” rồi chọn nhầm giới từ. So sánh hơn chỉ đi với than."
      },
      {
        "wrong": "Today is more bad than yesterday.",
        "right": "Today is worse than yesterday.",
        "why": "bad nằm trong nhóm bất quy tắc nên đổi hẳn thành worse, không ghép được với more."
      },
      {
        "wrong": "She is as tall than me.",
        "right": "She is as tall as me.",
        "why": "Người học nhớ mang máng rằng câu so sánh nào cũng có than. Khuôn as … as không dùng than."
      },
      {
        "wrong": "This is the most cheapest hotel in town.",
        "right": "This is the cheapest hotel in town.",
        "why": "Đã có đuôi -est thì không cần most nữa. Ghép cả hai là đánh dấu so sánh nhất hai lần."
      }
    ],
    "compare": {
      "with": "So sánh bằng",
      "rows": [
        {
          "key": "Ý nghĩa",
          "other": "Hai bên ngang nhau về một tiêu chí",
          "self": "Một bên trội hơn, hoặc trội nhất trong nhóm"
        },
        {
          "key": "Dạng tính từ",
          "other": "Giữ nguyên dạng gốc",
          "self": "Thêm -er / -est, hoặc mượn more / most"
        },
        {
          "key": "Từ nối",
          "other": "Kẹp giữa hai chữ as",
          "self": "than cho so sánh hơn, in hoặc of cho so sánh nhất"
        },
        {
          "key": "Mạo từ the",
          "other": "Không dùng",
          "self": "Bắt buộc có trước so sánh nhất"
        },
        {
          "key": "Ví dụ đối chiếu",
          "other": "My bag is as heavy as yours.",
          "self": "My bag is heavier than yours."
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Rơi mất một chữ as, viết thành as heavy yours",
          "self": "Quên the trước so sánh nhất, hoặc dùng cả more lẫn -er cho chắc"
        }
      ]
    },
    "items": [
      {
        "id": "comparison-1",
        "kind": "cloze",
        "prompt": "My brother is ___ than me. ",
        "answers": [
          "taller"
        ],
        "cue": "tall",
        "explain": "Tính từ một âm tiết chỉ cần thêm đuôi -er, không mượn thêm more.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-2",
        "kind": "mcq",
        "prompt": "This road is ___ than the old one.",
        "answers": [
          "wider"
        ],
        "options": [
          "wider",
          "more wide",
          "widest",
          "wide"
        ],
        "explain": "Hai con đường được đem ra so nên cần dạng so sánh hơn đi với than.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-3",
        "kind": "cloze",
        "prompt": "Her new phone is ___ than mine.",
        "answers": [
          "cheaper"
        ],
        "explain": "cheap là tính từ ngắn nên đổi đuôi chứ không ghép với more.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-4",
        "kind": "cloze",
        "prompt": "Today is ___ than yesterday. ",
        "answers": [
          "hotter"
        ],
        "cue": "hot",
        "explain": "Tính từ một âm tiết kết thúc bằng nguyên âm và một phụ âm thì gấp đôi phụ âm trước khi thêm -er.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-5",
        "kind": "mcq",
        "prompt": "My bag is heavier ___ yours.",
        "answers": [
          "than"
        ],
        "options": [
          "than",
          "as",
          "that",
          "from"
        ],
        "explain": "So sánh hơn luôn nối hai vế bằng than.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-6",
        "kind": "cloze",
        "prompt": "This book is ___ than the film. ",
        "answers": [
          "more interesting"
        ],
        "cue": "interesting",
        "explain": "Tính từ từ ba âm tiết trở lên giữ nguyên dạng và thêm more phía trước.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-7",
        "kind": "mcq",
        "prompt": "The second test was ___ than the first one.",
        "answers": [
          "more difficult"
        ],
        "options": [
          "more difficult",
          "difficulter",
          "difficult more",
          "most difficult"
        ],
        "explain": "difficult là tính từ dài nên không nhận được đuôi -er.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-8",
        "kind": "correct",
        "prompt": "Living in the city is expensiver than living in the countryside.",
        "answers": [
          "more expensive"
        ],
        "tokens": [
          "Living",
          "in",
          "the",
          "city",
          "is",
          "expensiver",
          "than",
          "living",
          "in",
          "the",
          "countryside."
        ],
        "errIndex": 5,
        "explain": "Tính từ ba âm tiết không đổi đuôi, dù nghe có vẻ xuôi tai.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-9",
        "kind": "cloze",
        "prompt": "A bicycle is ___ than a car in a narrow street. ",
        "answers": [
          "more useful"
        ],
        "cue": "useful",
        "explain": "useful có hai âm tiết và không kết thúc bằng -y nên đi với more.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-10",
        "kind": "mcq",
        "prompt": "Her English is ___ than mine.",
        "answers": [
          "better"
        ],
        "options": [
          "better",
          "gooder",
          "more good",
          "best"
        ],
        "explain": "good có dạng so sánh riêng, không theo quy tắc thêm -er.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-11",
        "kind": "cloze",
        "prompt": "The weather today is ___ than yesterday. ",
        "answers": [
          "worse"
        ],
        "cue": "bad",
        "explain": "bad đổi hẳn thành worse chứ không ghép với more.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-12",
        "kind": "correct",
        "prompt": "My house is farer from the station than yours.",
        "answers": [
          "farther"
        ],
        "tokens": [
          "My",
          "house",
          "is",
          "farer",
          "from",
          "the",
          "station",
          "than",
          "yours."
        ],
        "errIndex": 3,
        "explain": "far là tính từ bất quy tắc, dạng so sánh hơn là farther hoặc further.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-13",
        "kind": "cloze",
        "prompt": "She is ___ student in the class. ",
        "answers": [
          "the youngest"
        ],
        "cue": "young",
        "explain": "Chỉ có một người đứng đầu nhóm nên trước so sánh nhất luôn có the.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-14",
        "kind": "mcq",
        "prompt": "That was ___ meal of the trip.",
        "answers": [
          "the most expensive"
        ],
        "options": [
          "the most expensive",
          "most expensive",
          "the expensivest",
          "the more expensive"
        ],
        "explain": "Tính từ dài dùng the most, và chữ the không được bỏ.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-15",
        "kind": "correct",
        "prompt": "This is cheapest hotel in town.",
        "answers": [
          "the cheapest"
        ],
        "tokens": [
          "This",
          "is",
          "cheapest",
          "hotel",
          "in",
          "town."
        ],
        "errIndex": 2,
        "explain": "Tiếng Việt nói “rẻ nhất” không cần mạo từ nên the rất hay bị bỏ quên.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-16",
        "kind": "cloze",
        "prompt": "Ha Long Bay is one of ___ places in Viet Nam. ",
        "answers": [
          "the most beautiful"
        ],
        "cue": "beautiful",
        "explain": "Sau one of luôn là so sánh nhất kèm the và một danh từ số nhiều.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-17",
        "kind": "mcq",
        "prompt": "She is the tallest girl ___ her class.",
        "answers": [
          "in"
        ],
        "options": [
          "in",
          "of",
          "from",
          "at"
        ],
        "explain": "Phạm vi so sánh là một nhóm hay một nơi chốn thì đi với in.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-18",
        "kind": "cloze",
        "prompt": "It was ___ day of my life.",
        "answers": [
          "the worst"
        ],
        "explain": "worse chỉ dùng khi so hai bên, còn đứng đầu cả nhóm là worst.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-19",
        "kind": "cloze",
        "prompt": "My bag is as ___ as yours.",
        "answers": [
          "heavy"
        ],
        "explain": "Trong khuôn as … as, tính từ giữ nguyên dạng gốc.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-20",
        "kind": "mcq",
        "prompt": "This exercise is not as ___ as I expected.",
        "answers": [
          "hard"
        ],
        "options": [
          "hard",
          "harder",
          "hardest",
          "more hard"
        ],
        "explain": "Hai chữ as kẹp lấy tính từ nguyên dạng, kể cả trong câu phủ định.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-21",
        "kind": "correct",
        "prompt": "Your room is as big than mine.",
        "answers": [
          "as"
        ],
        "tokens": [
          "Your",
          "room",
          "is",
          "as",
          "big",
          "than",
          "mine."
        ],
        "errIndex": 5,
        "explain": "Cặp as … as phải đủ hai chữ as; than chỉ đi với so sánh hơn.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-22",
        "kind": "cloze",
        "prompt": "A taxi is twice ___ the bus.",
        "answers": [
          "as expensive as"
        ],
        "explain": "Muốn nói gấp mấy lần thì đặt số lần ngay trước cả khuôn as … as.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-23",
        "kind": "mcq",
        "prompt": "This flat is ___ than the one we saw yesterday.",
        "answers": [
          "much cheaper"
        ],
        "options": [
          "much cheaper",
          "very cheaper",
          "more cheaper",
          "much cheap"
        ],
        "explain": "Muốn nhấn mức chênh lệch thì dùng much hoặc far, không dùng very.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-24",
        "kind": "cloze",
        "prompt": "The exam was a bit ___ than I thought. ",
        "answers": [
          "easier"
        ],
        "cue": "easy",
        "explain": "a bit làm mức chênh lệch nhẹ đi và vẫn đứng trước dạng so sánh hơn; easy đổi y thành i.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-25",
        "kind": "cloze",
        "prompt": "Her salary is ___ than mine.",
        "answers": [
          "much higher"
        ],
        "explain": "very không đi với dạng so sánh hơn, chỗ này cần much hoặc far.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-26",
        "kind": "cloze",
        "prompt": "___ you practise, the faster you speak.",
        "answers": [
          "The more"
        ],
        "explain": "So sánh kép cần chữ the ở đầu cả hai vế để nối hai mức tăng.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-27",
        "kind": "mcq",
        "prompt": "The colder it gets, ___ tea I drink.",
        "answers": [
          "the more"
        ],
        "options": [
          "the more",
          "more",
          "the most",
          "most"
        ],
        "explain": "Vế thứ hai của so sánh kép cũng phải bắt đầu bằng the.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-28",
        "kind": "transform",
        "prompt": "My sister is 1.6 metres tall and I am 1.7 metres tall.",
        "answers": [
          "I am taller than my sister."
        ],
        "explain": "Gộp hai thông tin rời thành một câu so sánh hơn nối bằng than.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-29",
        "kind": "transform",
        "prompt": "No other student in the class is younger than Mai.",
        "answers": [
          "Mai is the youngest student in the class."
        ],
        "explain": "Không ai nhỏ tuổi hơn nghĩa là đứng đầu nhóm, nên chuyển sang so sánh nhất kèm the.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-30",
        "kind": "transform",
        "prompt": "This film is not as good as the book.",
        "answers": [
          "The book is better than this film."
        ],
        "explain": "Đảo vị trí hai vế thì so sánh bằng dạng phủ định thành so sánh hơn.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-31",
        "kind": "transform",
        "prompt": "The bus is cheaper than the taxi.",
        "answers": [
          "The taxi is more expensive than the bus."
        ],
        "explain": "Đổi chủ ngữ thì phải thay bằng tính từ trái nghĩa để giữ nguyên ý.",
        "errorTag": "Thiếu mạo từ"
      },
      {
        "id": "comparison-32",
        "kind": "transform",
        "prompt": "I have never read a more boring book than this one.",
        "answers": [
          "This is the most boring book I have ever read."
        ],
        "explain": "Câu phủ định kiểu “chưa từng gặp cái nào hơn” tương đương với so sánh nhất.",
        "errorTag": "Thiếu mạo từ"
      }
    ]
  },
  {
    "key": "present-perfect",
    "builtin": true,
    "name": "Thì hiện tại hoàn thành",
    "nameEn": "Present perfect",
    "level": "B1",
    "group": "Thì động từ",
    "description": "Nối một việc trong quá khứ với hiện tại: việc vừa xong còn để lại kết quả, việc từng trải qua, việc kéo dài tới bây giờ. Tiếng Việt gói cả thì này lẫn quá khứ đơn vào chữ “đã” và “rồi” nên người học rất khó nhận ra lúc nào phải dùng have cộng V3.",
    "icon": "clock",
    "tags": [
      "Nhầm thì"
    ],
    "signals": [
      "for",
      "since",
      "already",
      "yet",
      "just",
      "ever",
      "never",
      "recently",
      "so far",
      "this week"
    ],
    "formulas": [
      {
        "form": "Khẳng định",
        "structure": "S + have / has + V3",
        "example": "I have finished my homework."
      },
      {
        "form": "Phủ định",
        "structure": "S + have / has + not + V3",
        "example": "She has not replied to my email yet."
      },
      {
        "form": "Nghi vấn",
        "structure": "Have / Has + S + V3?",
        "example": "Have you ever been to Da Nang?"
      },
      {
        "form": "Khoảng thời gian kéo dài",
        "structure": "S + have / has + V3 + for / since …",
        "example": "They have lived here since 2019."
      },
      {
        "form": "Hiện tại hoàn thành tiếp diễn",
        "structure": "S + have / has + been + V-ing",
        "example": "I have been waiting for two hours."
      },
      {
        "form": "Lần đầu tiên",
        "structure": "This is the first time + S + have / has + V3",
        "example": "This is the first time I have eaten sushi."
      }
    ],
    "uses": [
      {
        "name": "Việc vừa xong, kết quả còn nguyên",
        "sample": "I {have lost} my keys, so I cannot open the door.",
        "note": "Người nói không quan tâm mất lúc nào, chỉ quan tâm bây giờ vẫn chưa vào được nhà."
      },
      {
        "name": "Kinh nghiệm trong đời",
        "sample": "{Have} you ever {been} to Japan?",
        "note": "Hỏi từng trải qua hay chưa, không nêu thời điểm. Đi rồi về thì dùng been to."
      },
      {
        "name": "Việc kéo dài tới hiện tại",
        "sample": "They {have lived} in this house {for} ten years.",
        "note": "Bắt đầu từ mười năm trước và tới giờ vẫn ở đó, nên không dùng quá khứ đơn."
      },
      {
        "name": "Mốc bắt đầu với since",
        "sample": "I {have known} Lan {since} we were at primary school.",
        "note": "since đứng trước một mốc thời gian, for đứng trước độ dài một khoảng."
      },
      {
        "name": "Việc xong sớm hơn mong đợi",
        "sample": "I {have already sent} the report to my manager.",
        "note": "already nằm giữa have và V3, dùng cho câu khẳng định."
      },
      {
        "name": "Việc tới giờ vẫn chưa xảy ra",
        "sample": "She {has not replied} to my message yet.",
        "note": "yet đứng cuối câu phủ định và câu hỏi, nghĩa là tính tới lúc này vẫn chưa."
      },
      {
        "name": "Việc vừa mới xảy ra",
        "sample": "The train {has just left} the station.",
        "note": "just nằm giữa has và V3, chỉ khoảng cách rất ngắn so với lúc nói."
      },
      {
        "name": "Khoảng thời gian chưa khép lại",
        "sample": "I {have drunk} three cups of coffee today.",
        "note": "today vẫn đang diễn ra nên con số còn có thể tăng, khác hẳn yesterday."
      },
      {
        "name": "Việc kéo dài liên tục",
        "sample": "It {has been raining} all morning.",
        "note": "Muốn nhấn vào quá trình kéo dài chứ không phải kết quả thì dùng have been cộng V-ing."
      }
    ],
    "traps": [
      {
        "wrong": "I have seen that film last night.",
        "right": "I saw that film last night.",
        "why": "Người học nghĩ “đã xem rồi” là hiện tại hoàn thành. Nhưng last night là mốc đã khép lại nên câu phải về quá khứ đơn."
      },
      {
        "wrong": "She has went to school.",
        "right": "She has gone to school.",
        "why": "went là dạng V2. Sau have hoặc has luôn là V3, hai cột này rất hay bị lẫn."
      },
      {
        "wrong": "I am living here for five years.",
        "right": "I have lived here for five years.",
        "why": "Tiếng Việt nói “tôi sống ở đây được năm năm rồi” ở dạng hiện tại, nên người học chọn hiện tại tiếp diễn thay vì have cộng V3."
      },
      {
        "wrong": "I have studied English since three years.",
        "right": "I have studied English for three years.",
        "why": "Ba năm là độ dài một khoảng chứ không phải một mốc, nên đi với for."
      },
      {
        "wrong": "Have you ever go to Ha Noi?",
        "right": "Have you ever been to Ha Noi?",
        "why": "Sau have phải là V3, và hỏi kinh nghiệm đã đi rồi về thì dùng been to."
      },
      {
        "wrong": "He has gone to Paris twice.",
        "right": "He has been to Paris twice.",
        "why": "gone to nghĩa là đã đi và chưa quay lại, nên không đếm số lần được."
      },
      {
        "wrong": "This is the first time I go abroad.",
        "right": "This is the first time I have been abroad.",
        "why": "Tiếng Việt nói “lần đầu tôi ra nước ngoài” ở thì hiện tại. Khuôn này trong tiếng Anh luôn kéo theo have cộng V3."
      }
    ],
    "compare": {
      "with": "Quá khứ đơn",
      "rows": [
        {
          "key": "Mốc thời gian",
          "other": "Nói rõ lúc nào: yesterday, last week, in 2019",
          "self": "Không nói lúc nào, hoặc thời gian chưa khép lại"
        },
        {
          "key": "Quan hệ với hiện tại",
          "other": "Việc đã đóng lại, không còn liên quan tới bây giờ",
          "self": "Việc còn để lại kết quả, hoặc còn kéo dài tới bây giờ"
        },
        {
          "key": "Dạng động từ",
          "other": "V2: went, saw, did",
          "self": "have / has + V3: have gone, have seen, have done"
        },
        {
          "key": "Từ đi kèm",
          "other": "ago, yesterday, last night, in 2019",
          "self": "for, since, already, yet, just, ever, never"
        },
        {
          "key": "Ví dụ đối chiếu",
          "other": "I lost my keys yesterday.",
          "self": "I have lost my keys, so I cannot get in."
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Thấy chữ “đã” là chọn ngay quá khứ đơn cho mọi trường hợp",
          "self": "Dùng have cộng V3 nhưng vẫn gắn thêm một mốc đã kết thúc"
        }
      ]
    },
    "timeline": true,
    "items": [
      {
        "id": "present-perfect-1",
        "kind": "cloze",
        "prompt": "I ___ my homework, so I can watch TV now. ",
        "answers": [
          "have finished"
        ],
        "cue": "finish",
        "explain": "Việc vừa xong và kết quả là bây giờ đã rảnh.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-2",
        "kind": "mcq",
        "prompt": "She ___ in Da Nang for three years.",
        "answers": [
          "has lived"
        ],
        "options": [
          "has lived",
          "have lived",
          "has live",
          "is living"
        ],
        "explain": "Chủ ngữ số ít đi với has, và ngay sau đó là V3.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-3",
        "kind": "cloze",
        "prompt": "They ___ here since March.",
        "answers": [
          "have worked"
        ],
        "explain": "they là số nhiều nên chọn have, không phải has.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-4",
        "kind": "cloze",
        "prompt": "He ___ his phone, so he cannot call you. ",
        "answers": [
          "has broken"
        ],
        "cue": "break",
        "explain": "break là động từ bất quy tắc, V3 là broken chứ không thêm -ed.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-5",
        "kind": "mcq",
        "prompt": "We ___ each other since 2019.",
        "answers": [
          "have not seen"
        ],
        "options": [
          "have not seen",
          "have not saw",
          "did not saw",
          "have not see"
        ],
        "explain": "Sau have not vẫn là V3, không phải V2 hay động từ nguyên thể.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-6",
        "kind": "cloze",
        "prompt": "I have known Lan ___ we were at primary school.",
        "answers": [
          "since"
        ],
        "explain": "Phía sau là một mốc bắt đầu trong quá khứ nên dùng since.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-7",
        "kind": "mcq",
        "prompt": "They have been married ___ twenty years.",
        "answers": [
          "for"
        ],
        "options": [
          "for",
          "since",
          "during",
          "in"
        ],
        "explain": "Hai mươi năm là độ dài một khoảng, không phải một mốc.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-8",
        "kind": "correct",
        "prompt": "She has taught at this school since almost ten years.",
        "answers": [
          "for"
        ],
        "tokens": [
          "She",
          "has",
          "taught",
          "at",
          "this",
          "school",
          "since",
          "almost",
          "ten",
          "years."
        ],
        "errIndex": 6,
        "explain": "Gần mười năm là một khoảng dài nên phải đi với for.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-9",
        "kind": "cloze",
        "prompt": "How long ___ you known each other?",
        "answers": [
          "have"
        ],
        "explain": "Câu hỏi How long hỏi khoảng thời gian kéo dài tới bây giờ nên mở đầu bằng have.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-10",
        "kind": "cloze",
        "prompt": "We ___ here for half an hour and the bus has not come. ",
        "answers": [
          "have waited"
        ],
        "cue": "wait",
        "explain": "Việc bắt đầu trong quá khứ và tới lúc nói vẫn đang tiếp tục.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-11",
        "kind": "mcq",
        "prompt": "I have ___ booked the tickets, so you do not need to worry.",
        "answers": [
          "already"
        ],
        "options": [
          "already",
          "yet",
          "still",
          "ever"
        ],
        "explain": "already dùng trong câu khẳng định, nói việc xong sớm hơn dự kiến.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-12",
        "kind": "cloze",
        "prompt": "Have you cleaned your room ___?",
        "answers": [
          "yet"
        ],
        "explain": "yet đứng cuối câu hỏi để hỏi việc đã xong hay chưa.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-13",
        "kind": "correct",
        "prompt": "I have yet paid the electricity bill.",
        "answers": [
          "already"
        ],
        "tokens": [
          "I",
          "have",
          "yet",
          "paid",
          "the",
          "electricity",
          "bill."
        ],
        "errIndex": 2,
        "explain": "Câu khẳng định dùng already; yet chỉ dành cho câu hỏi và câu phủ định.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-14",
        "kind": "cloze",
        "prompt": "The train has ___ left, so we have to wait for the next one.",
        "answers": [
          "just"
        ],
        "explain": "just nằm giữa has và V3, chỉ việc vừa mới xảy ra cách đây rất ít phút.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-15",
        "kind": "mcq",
        "prompt": "Have you ever ___ to Singapore?",
        "answers": [
          "been"
        ],
        "options": [
          "been",
          "gone",
          "went",
          "be"
        ],
        "explain": "Hỏi kinh nghiệm đã tới nơi rồi quay về thì dùng been to.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-16",
        "kind": "cloze",
        "prompt": "I have never ___ durian in my life. ",
        "answers": [
          "eaten"
        ],
        "cue": "eat",
        "explain": "never đã mang sẵn nghĩa phủ định nên không thêm not nữa.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-17",
        "kind": "correct",
        "prompt": "She is not in the office because she has been to the bank.",
        "answers": [
          "gone"
        ],
        "tokens": [
          "She",
          "is",
          "not",
          "in",
          "the",
          "office",
          "because",
          "she",
          "has",
          "been",
          "to",
          "the",
          "bank."
        ],
        "errIndex": 9,
        "explain": "gone to nghĩa là đã đi và tới giờ vẫn chưa quay lại.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-18",
        "kind": "cloze",
        "prompt": "He has ___ to Ha Noi, but he wants to visit next year.",
        "answers": [
          "never been"
        ],
        "explain": "Nói về kinh nghiệm sống thì dùng been to, vì người đó không còn ở đó nữa.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-19",
        "kind": "mcq",
        "prompt": "This is the first time I ___ sushi.",
        "answers": [
          "have eaten"
        ],
        "options": [
          "have eaten",
          "eat",
          "ate",
          "am eating"
        ],
        "explain": "Khuôn This is the first time luôn kéo theo have cộng V3.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-20",
        "kind": "mcq",
        "prompt": "I ___ that film last night.",
        "answers": [
          "saw"
        ],
        "options": [
          "saw",
          "have seen",
          "had seen",
          "have saw"
        ],
        "explain": "last night là mốc đã khép lại nên câu thuộc về quá khứ đơn.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-21",
        "kind": "cloze",
        "prompt": "We ___ Hue in 2019.",
        "answers": [
          "visited"
        ],
        "explain": "in 2019 đã kết thúc hẳn, không còn nối được với hiện tại.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-22",
        "kind": "cloze",
        "prompt": "I ___ three cups of coffee today. ",
        "answers": [
          "have drunk"
        ],
        "cue": "drink",
        "explain": "today chưa khép lại nên số lần vẫn còn có thể tăng thêm.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-23",
        "kind": "mcq",
        "prompt": "She ___ me back yet.",
        "answers": [
          "has not called"
        ],
        "options": [
          "has not called",
          "did not called",
          "has not call",
          "not called"
        ],
        "explain": "yet cho thấy việc còn treo tới bây giờ nên dùng has not cộng V3.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-24",
        "kind": "cloze",
        "prompt": "It ___ all morning and the roads are wet. ",
        "answers": [
          "has been raining"
        ],
        "cue": "rain",
        "explain": "Việc kéo dài liên tục tới lúc nói nên dùng has been cộng V-ing.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-25",
        "kind": "mcq",
        "prompt": "My eyes hurt because I ___ at the screen all day.",
        "answers": [
          "have been staring"
        ],
        "options": [
          "have been staring",
          "have stared",
          "am staring",
          "stared"
        ],
        "explain": "Nhấn vào quá trình kéo dài và hậu quả còn thấy được ngay lúc này.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-26",
        "kind": "correct",
        "prompt": "She has been work in that company since 2020.",
        "answers": [
          "working"
        ],
        "tokens": [
          "She",
          "has",
          "been",
          "work",
          "in",
          "that",
          "company",
          "since",
          "2020."
        ],
        "errIndex": 3,
        "explain": "Sau have been là V-ing khi muốn nhấn quá trình vẫn còn tiếp tục.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-27",
        "kind": "transform",
        "prompt": "I started learning English five years ago and I still learn it now.",
        "answers": [
          "I have learned English for five years."
        ],
        "explain": "Việc bắt đầu trong quá khứ và còn tiếp tục thì gói vào have cộng V3 với for.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-28",
        "kind": "transform",
        "prompt": "This is my first visit to Ha Noi.",
        "answers": [
          "This is the first time I have been to Ha Noi."
        ],
        "explain": "Lần đầu làm việc gì luôn kéo theo khuôn have cộng V3.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-29",
        "kind": "transform",
        "prompt": "I lost my wallet this morning and I still do not have it.",
        "answers": [
          "I have lost my wallet."
        ],
        "explain": "Kết quả vẫn còn nguyên nên bỏ mốc thời gian và chuyển sang have cộng V3.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-30",
        "kind": "transform",
        "prompt": "The last time I saw Minh was in 2018.",
        "answers": [
          "I have not seen Minh since 2018."
        ],
        "explain": "Câu nói về lần cuối cùng tương đương với have not cộng V3 kèm since.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "present-perfect-31",
        "kind": "transform",
        "prompt": "He began working here in January.",
        "answers": [
          "He has worked here since January."
        ],
        "explain": "since giữ nguyên mốc bắt đầu, còn động từ chuyển sang has cộng V3.",
        "errorTag": "Nhầm thì"
      }
    ]
  },
  {
    "key": "modals",
    "builtin": true,
    "name": "Động từ khuyết thiếu",
    "nameEn": "Modal verbs",
    "level": "B1",
    "group": "Động từ & cấu trúc",
    "description": "Nhóm động từ đứng trước động từ chính để nói về khả năng, sự bắt buộc, lời khuyên hay lời phỏng đoán. Tiếng Việt đặt “có thể, phải, nên” trước động từ mà không ràng buộc gì thêm, nên người học vẫn chia động từ phía sau hoặc ghép hai từ như “sẽ có thể” lại với nhau.",
    "icon": "bulb",
    "tags": [
      "Nhầm thì"
    ],
    "signals": [
      "can",
      "could",
      "may",
      "might",
      "must",
      "have to",
      "should",
      "ought to",
      "had better",
      "would"
    ],
    "formulas": [
      {
        "form": "Khẳng định",
        "structure": "S + modal + V (nguyên thể, không to)",
        "example": "She can speak three languages."
      },
      {
        "form": "Phủ định",
        "structure": "S + modal + not + V",
        "example": "You must not park in front of the gate."
      },
      {
        "form": "Nghi vấn",
        "structure": "Modal + S + V?",
        "example": "Could you open the window, please?"
      },
      {
        "form": "Khả năng ở tương lai",
        "structure": "S + will be able to + V",
        "example": "I will be able to help you tomorrow."
      },
      {
        "form": "Bắt buộc do hoàn cảnh",
        "structure": "S + have to / has to / had to + V",
        "example": "I have to work this Saturday."
      },
      {
        "form": "Phỏng đoán",
        "structure": "S + may / might / could + V",
        "example": "He might be at the library."
      },
      {
        "form": "Lời khuyên gấp",
        "structure": "S + had better + V",
        "example": "You had better see a doctor."
      }
    ],
    "uses": [
      {
        "name": "Khả năng ở hiện tại",
        "sample": "She {can} speak three languages fluently.",
        "note": "can nói về năng lực sẵn có. Động từ phía sau giữ nguyên dạng gốc, không thêm -s."
      },
      {
        "name": "Khả năng từng có trong quá khứ",
        "sample": "When I was ten, I {could} swim across the lake.",
        "note": "could là dạng quá khứ của can, dùng cho năng lực kéo dài một giai đoạn."
      },
      {
        "name": "Khả năng ở tương lai",
        "sample": "I {will be able to} help you after five o'clock.",
        "note": "will và can không đứng cạnh nhau, nên can phải mượn dạng be able to."
      },
      {
        "name": "Quy định bắt buộc",
        "sample": "Passengers {must} show their tickets before boarding.",
        "note": "must nêu quy định hoặc yêu cầu tự thấy là cần thiết. Sau must không có to."
      },
      {
        "name": "Cấm và không bắt buộc",
        "sample": "You {must not} smoke here, but you {do not have to} pay for the parking.",
        "note": "mustn't là cấm hẳn, don't have to là muốn làm cũng được, không làm cũng không sao."
      },
      {
        "name": "Hoàn cảnh bên ngoài bắt buộc",
        "sample": "I {have to} work this Saturday because my colleague is ill.",
        "note": "have to dùng khi sức ép đến từ bên ngoài. Dạng quá khứ của cả must lẫn have to đều là had to."
      },
      {
        "name": "Lời khuyên",
        "sample": "You {should} take an umbrella because the sky looks grey.",
        "note": "should và ought to đều nêu lời khuyên, nhưng ought to giữ chữ to còn should thì không."
      },
      {
        "name": "Phỏng đoán không chắc",
        "sample": "He {might} be at the library because his bike is outside.",
        "note": "may, might, could đều nói việc có thể đúng. Mức chắc chắn giảm dần từ may xuống might."
      },
      {
        "name": "Đề nghị lịch sự",
        "sample": "{Could} you send me the file again, please?",
        "note": "Could và Would nghe lịch sự hơn Can. Sau Would you mind thì động từ chuyển sang đuôi -ing."
      }
    ],
    "traps": [
      {
        "wrong": "She can speaks English very well.",
        "right": "She can speak English very well.",
        "why": "Tiếng Việt nói “cô ấy có thể nói” không đổi dạng động từ, nên người học giữ luôn đuôi -s theo thói quen. Sau modal, động từ trở về dạng gốc."
      },
      {
        "wrong": "I will can help you tomorrow.",
        "right": "I will be able to help you tomorrow.",
        "why": "“Sẽ có thể” ghép được trong tiếng Việt, nhưng tiếng Anh không cho hai modal đứng cạnh nhau nên can đổi thành be able to."
      },
      {
        "wrong": "You must to finish the report today.",
        "right": "You must finish the report today.",
        "why": "must đi thẳng với động từ nguyên thể. Chỉ have to và ought to mới giữ chữ to."
      },
      {
        "wrong": "It is Sunday, so you must not get up early.",
        "right": "It is Sunday, so you do not have to get up early.",
        "why": "Tiếng Việt gộp cả hai ý vào chữ “không phải”. Trong tiếng Anh, mustn't là cấm còn don't have to là không bắt buộc."
      },
      {
        "wrong": "Do you can come to the meeting?",
        "right": "Can you come to the meeting?",
        "why": "Modal tự đảo lên đầu câu hỏi. Người học quen dùng do cho mọi câu hỏi nên thêm cả trợ động từ."
      },
      {
        "wrong": "She should to see a doctor.",
        "right": "She should see a doctor.",
        "why": "should cũng thuộc nhóm modal nên phía sau là động từ nguyên thể không to."
      },
      {
        "wrong": "I had better to call him before he leaves.",
        "right": "I had better call him before he leaves.",
        "why": "had better là một khối cố định, phía sau vẫn là động từ nguyên thể."
      }
    ],
    "compare": {
      "with": "Động từ thường",
      "rows": [
        {
          "key": "Đuôi -s ở ngôi thứ ba",
          "other": "Bắt buộc có: He works late.",
          "self": "Không bao giờ có: He can work late."
        },
        {
          "key": "Từ đứng ngay sau",
          "other": "Có thể là to + V hoặc V-ing tùy động từ",
          "self": "Luôn là động từ nguyên thể, không to"
        },
        {
          "key": "Câu phủ định và câu hỏi",
          "other": "Phải mượn trợ động từ do, does, did",
          "self": "Tự thêm not, tự đảo lên trước chủ ngữ"
        },
        {
          "key": "Hai từ đứng liền nhau",
          "other": "Nối được bằng to: want to go, need to go",
          "self": "Không đặt hai modal cạnh nhau: will can là sai"
        },
        {
          "key": "Ví dụ đối chiếu",
          "other": "She wants to go home early.",
          "self": "She must go home early."
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Quên đuôi -s ở ngôi thứ ba",
          "self": "Vẫn chia động từ sau modal, hoặc dịch thẳng “sẽ có thể” thành will can"
        }
      ]
    },
    "items": [
      {
        "id": "modals-1",
        "kind": "mcq",
        "prompt": "She can ___ three languages fluently.",
        "answers": [
          "speak"
        ],
        "options": [
          "speak",
          "speaks",
          "to speak",
          "speaking"
        ],
        "explain": "Sau modal luôn là động từ nguyên thể, không chia thêm đuôi -s.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-2",
        "kind": "correct",
        "prompt": "My brother can plays the guitar quite well.",
        "answers": [
          "play"
        ],
        "tokens": [
          "My",
          "brother",
          "can",
          "plays",
          "the",
          "guitar",
          "quite",
          "well."
        ],
        "errIndex": 3,
        "explain": "Modal không kéo theo đuôi -s dù chủ ngữ là ngôi thứ ba số ít.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-3",
        "kind": "cloze",
        "prompt": "You should ___ your teacher before you hand it in.",
        "answers": [
          "ask"
        ],
        "explain": "Sau should là động từ nguyên thể, không có chữ to xen vào.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-4",
        "kind": "cloze",
        "prompt": "You must ___ the report before Friday.",
        "answers": [
          "finish"
        ],
        "explain": "must đi thẳng với động từ nguyên thể nên chữ to là thừa.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-5",
        "kind": "cloze",
        "prompt": "When I was ten, I ___ swim across the lake.",
        "answers": [
          "could"
        ],
        "explain": "could là dạng quá khứ của can, nói về năng lực từng có.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-6",
        "kind": "mcq",
        "prompt": "I ___ help you after five o'clock.",
        "answers": [
          "will be able to"
        ],
        "options": [
          "will be able to",
          "will can",
          "can will",
          "am can"
        ],
        "explain": "Hai modal không đứng cạnh nhau nên can phải đổi thành be able to.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-7",
        "kind": "cloze",
        "prompt": "We ___ move into the new office next month.",
        "answers": [
          "will be able to"
        ],
        "explain": "will đã là modal rồi nên ngay sau nó không thể là một modal khác.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-8",
        "kind": "cloze",
        "prompt": "Sorry, I ___ come tonight because I have to work.",
        "answers": [
          "cannot"
        ],
        "explain": "can tự thêm not và viết liền một chữ, không mượn trợ động từ do.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-9",
        "kind": "cloze",
        "prompt": "He ___ join us at the weekend.",
        "answers": [
          "cannot"
        ],
        "explain": "Modal tự phủ định lấy, khác hẳn động từ thường phải mượn does not.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-10",
        "kind": "cloze",
        "prompt": "Passengers ___ show their tickets before boarding.",
        "answers": [
          "must"
        ],
        "explain": "Đây là quy định của nhà xe chứ không phải ý riêng người nói.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-11",
        "kind": "mcq",
        "prompt": "You ___ touch these wires because they are dangerous.",
        "answers": [
          "must not"
        ],
        "options": [
          "must not",
          "do not have to",
          "need not",
          "must not to"
        ],
        "explain": "Đây là điều bị cấm vì nguy hiểm, không phải chuyện làm hay không cũng được.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-12",
        "kind": "cloze",
        "prompt": "It is Sunday, so you ___ get up early.",
        "answers": [
          "do not have to"
        ],
        "explain": "Chủ nhật không ai cấm dậy sớm, chỉ là không bắt buộc phải dậy.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-13",
        "kind": "mcq",
        "prompt": "You ___ wear a uniform on Friday, so you can come in jeans if you like.",
        "answers": [
          "do not have to"
        ],
        "options": [
          "do not have to",
          "must not",
          "should not",
          "do not must"
        ],
        "explain": "Được phép mặc tự do nghĩa là không bắt buộc, không phải bị cấm.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-14",
        "kind": "mcq",
        "prompt": "I ___ work this Saturday because my colleague is ill.",
        "answers": [
          "have to"
        ],
        "options": [
          "have to",
          "must to",
          "has to",
          "am have to"
        ],
        "explain": "Sức ép đến từ hoàn cảnh bên ngoài, và sau must không bao giờ có to.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-15",
        "kind": "cloze",
        "prompt": "She ___ leave the meeting early yesterday. ",
        "answers": [
          "had to"
        ],
        "cue": "have to",
        "explain": "must không có dạng quá khứ nên phải mượn had to.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-16",
        "kind": "mcq",
        "prompt": "You ___ a doctor if the pain continues.",
        "answers": [
          "should see"
        ],
        "options": [
          "should see",
          "should to see",
          "should seeing",
          "shall see"
        ],
        "explain": "should nêu lời khuyên và đi với động từ nguyên thể không to.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-17",
        "kind": "cloze",
        "prompt": "We ___ book the tickets early if we want good seats.",
        "answers": [
          "ought to"
        ],
        "explain": "ought to là biến thể trang trọng hơn của should và luôn giữ chữ to.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-18",
        "kind": "cloze",
        "prompt": "You had better ___ him before he leaves the office.",
        "answers": [
          "call"
        ],
        "explain": "had better là khối cố định, phía sau vẫn là động từ nguyên thể.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-19",
        "kind": "cloze",
        "prompt": "The traffic is terrible, so we ___ take the metro.",
        "answers": [
          "had better"
        ],
        "explain": "had better nêu lời khuyên gấp, kèm hàm ý không làm thì sẽ gặp rắc rối.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-20",
        "kind": "cloze",
        "prompt": "He ___ be at the library because his bike is outside.",
        "answers": [
          "might"
        ],
        "explain": "Người nói chỉ suy đoán từ một dấu hiệu chứ không chắc chắn.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-21",
        "kind": "mcq",
        "prompt": "It ___ this afternoon, so take an umbrella.",
        "answers": [
          "may rain"
        ],
        "options": [
          "may rain",
          "may rains",
          "may to rain",
          "mays rain"
        ],
        "explain": "may cũng là modal nên động từ theo sau giữ nguyên dạng gốc.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-22",
        "kind": "correct",
        "prompt": "She maybe busy this evening, so call her tomorrow.",
        "answers": [
          "may be"
        ],
        "tokens": [
          "She",
          "maybe",
          "busy",
          "this",
          "evening,",
          "so",
          "call",
          "her",
          "tomorrow."
        ],
        "errIndex": 1,
        "explain": "maybe là một trạng từ; chỗ này cần modal may cộng động từ be.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-23",
        "kind": "cloze",
        "prompt": "Take a map with you because you ___ get lost in the old town.",
        "answers": [
          "could"
        ],
        "explain": "could ở đây không nói khả năng làm được mà nói một việc có thể xảy ra.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-24",
        "kind": "cloze",
        "prompt": "___ you speak more slowly, please?",
        "answers": [
          "Could"
        ],
        "explain": "Dùng could thay can để lời đề nghị nghe lịch sự hơn.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-25",
        "kind": "mcq",
        "prompt": "___ opening the window?",
        "answers": [
          "Would you mind"
        ],
        "options": [
          "Would you mind",
          "Would you mind to",
          "Do you mind to",
          "Would you minding"
        ],
        "explain": "Sau Would you mind luôn là động từ đuôi -ing.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-26",
        "kind": "transform",
        "prompt": "It is forbidden to use your phone during the exam.",
        "answers": [
          "You must not use your phone during the exam."
        ],
        "explain": "Điều bị cấm hẳn thì gói lại bằng must not.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-27",
        "kind": "transform",
        "prompt": "It is not necessary for you to come early tomorrow.",
        "answers": [
          "You do not have to come early tomorrow."
        ],
        "explain": "Không bắt buộc thì dùng do not have to, dùng must not là thành cấm.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-28",
        "kind": "transform",
        "prompt": "Perhaps she is stuck in traffic.",
        "answers": [
          "She may be stuck in traffic."
        ],
        "explain": "Lời phỏng đoán chuyển thành modal may cộng động từ nguyên thể.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-29",
        "kind": "transform",
        "prompt": "It is a good idea for you to book the hotel now.",
        "answers": [
          "You should book the hotel now."
        ],
        "explain": "Lời khuyên gói gọn lại bằng should.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modals-30",
        "kind": "transform",
        "prompt": "I was not able to open the file yesterday.",
        "answers": [
          "I could not open the file yesterday."
        ],
        "explain": "could not là dạng quá khứ của cannot nên thay được cho was not able to.",
        "errorTag": "Nhầm thì"
      }
    ]
  },
  {
    "key": "passive",
    "builtin": true,
    "name": "Câu bị động",
    "nameEn": "Passive voice",
    "level": "B1",
    "group": "Động từ & cấu trúc",
    "description": "Đưa đối tượng chịu tác động lên làm chủ ngữ khi người làm không quan trọng hoặc không rõ. Tiếng Việt chỉ cần đặt “bị” hay “được” trước động từ và giữ nguyên động từ, nên người học hay quên be hoặc quên chuyển động từ sang V3.",
    "icon": "repeat",
    "tags": [
      "Thiếu to be",
      "Nhầm thì"
    ],
    "signals": [
      "by",
      "be",
      "been",
      "being",
      "was",
      "were",
      "will be",
      "must be",
      "it is said that",
      "have something done"
    ],
    "formulas": [
      {
        "form": "Hiện tại đơn",
        "structure": "S + am / is / are + V3",
        "example": "English is spoken in many countries."
      },
      {
        "form": "Quá khứ đơn",
        "structure": "S + was / were + V3",
        "example": "This bridge was built in 1990."
      },
      {
        "form": "Hiện tại hoàn thành",
        "structure": "S + have / has been + V3",
        "example": "The room has been cleaned."
      },
      {
        "form": "Tương lai và động từ khuyết thiếu",
        "structure": "S + will be / must be / can be + V3",
        "example": "This form must be signed by both parents."
      },
      {
        "form": "Đang diễn ra",
        "structure": "S + am / is / are being + V3",
        "example": "The road is being repaired at the moment."
      },
      {
        "form": "Tin đồn, ý kiến chung",
        "structure": "It is said that + S + V; S + is said to + V",
        "example": "It is said that the old house is over two hundred years old."
      },
      {
        "form": "Nhờ người khác làm",
        "structure": "S + have / has / had + O + V3",
        "example": "I had my bike repaired yesterday."
      }
    ],
    "uses": [
      {
        "name": "Sự thật chung, không cần nói ai làm",
        "sample": "English {is spoken} in more than fifty countries.",
        "note": "Người nói không quan tâm ai nói tiếng Anh, chỉ quan tâm việc đó diễn ra ở đâu."
      },
      {
        "name": "Không biết ai là người làm",
        "sample": "My wallet {was stolen} on the bus yesterday.",
        "note": "Không rõ thủ phạm nên bỏ hẳn phần by. Be chia ở quá khứ vì việc đã xảy ra hôm qua."
      },
      {
        "name": "Khi người làm đáng nhắc tới",
        "sample": "This song {was written} by a nineteen-year-old student.",
        "note": "Chỉ giữ by khi thông tin đó thật sự đáng chú ý, còn lại thì lược bỏ."
      },
      {
        "name": "Nhấn vào kết quả còn giữ",
        "sample": "The room {has been cleaned}, so you can move in.",
        "note": "Hiện tại hoàn thành bị động gồm has been cộng V3, nhấn vào tình trạng hiện giờ."
      },
      {
        "name": "Thông báo trang trọng",
        "sample": "The results {will be announced} on Friday morning.",
        "note": "Sau will luôn có be rồi mới tới V3. Kiểu câu này hay gặp ở thông báo và nội quy."
      },
      {
        "name": "Bị động với động từ khuyết thiếu",
        "sample": "This form {must be signed} by both parents.",
        "note": "Sau modal, be giữ nguyên dạng gốc rồi mới tới V3."
      },
      {
        "name": "Việc đang diễn ra",
        "sample": "The road {is being repaired} at the moment.",
        "note": "Thì tiếp diễn bị động cần thêm being đứng giữa be và V3."
      },
      {
        "name": "Câu có hai tân ngữ",
        "sample": "We {were given} a free map at the hotel.",
        "note": "Động từ như give, send, offer có hai tân ngữ, và người nhận thường được đưa lên làm chủ ngữ."
      },
      {
        "name": "Nhờ người khác làm giúp",
        "sample": "I {had} my bike {repaired} yesterday.",
        "note": "Khuôn have something done nói việc mình thuê người khác làm chứ không tự làm."
      }
    ],
    "traps": [
      {
        "wrong": "This bridge built in 1990.",
        "right": "This bridge was built in 1990.",
        "why": "Tiếng Việt nói “cây cầu được xây năm 1990” chỉ cần một chữ “được”. Tiếng Anh bắt buộc có be trước V3."
      },
      {
        "wrong": "The letter was write by my grandfather.",
        "right": "The letter was written by my grandfather.",
        "why": "Sau be phải là V3. Người học nhớ được be nhưng lại để động từ ở dạng gốc."
      },
      {
        "wrong": "My wallet was stole yesterday.",
        "right": "My wallet was stolen yesterday.",
        "why": "stole là cột V2. Bị động luôn lấy cột V3, hai cột này rất hay bị nhìn nhầm."
      },
      {
        "wrong": "The homework must be do before Monday.",
        "right": "The homework must be done before Monday.",
        "why": "Sau be là V3 chứ không phải động từ nguyên thể, dù phía trước đã có modal."
      },
      {
        "wrong": "The accident was happened last night.",
        "right": "The accident happened last night.",
        "why": "Tiếng Việt nói “tai nạn đã bị xảy ra” vẫn xuôi tai. Nhưng happen không có tân ngữ nên không thể chuyển sang bị động."
      },
      {
        "wrong": "The results will announced tomorrow.",
        "right": "The results will be announced tomorrow.",
        "why": "Người học nhớ V3 nhưng bỏ mất be. Sau modal luôn phải có be rồi mới tới V3."
      },
      {
        "wrong": "He is said that he is one of the best coaches.",
        "right": "It is said that he is one of the best coaches.",
        "why": "Có hai khuôn riêng: It is said that cộng cả mệnh đề, hoặc He is said to be. Người học hay trộn lẫn hai khuôn này."
      }
    ],
    "compare": {
      "with": "Câu chủ động",
      "rows": [
        {
          "key": "Chủ ngữ là ai",
          "other": "Người hoặc vật thực hiện hành động",
          "self": "Người hoặc vật chịu tác động của hành động"
        },
        {
          "key": "Dạng động từ",
          "other": "Chia thẳng theo thì: builds, built, will build",
          "self": "be chia theo thì rồi cộng V3: is built, was built, will be built"
        },
        {
          "key": "Vị trí người làm",
          "other": "Đứng đầu câu, luôn có mặt",
          "self": "Đứng sau by, hoặc lược bỏ hẳn nếu không cần"
        },
        {
          "key": "Khi nào dùng",
          "other": "Khi người làm là thông tin chính",
          "self": "Khi sự việc hoặc kết quả mới là thông tin chính"
        },
        {
          "key": "Ví dụ đối chiếu",
          "other": "They built this bridge in 1990.",
          "self": "This bridge was built in 1990."
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Luôn chọn chủ động vì quen kể ai làm gì",
          "self": "Quên be hoặc để động từ ở dạng gốc, vì “bị” và “được” không bắt động từ đổi dạng"
        }
      ]
    },
    "items": [
      {
        "id": "passive-1",
        "kind": "cloze",
        "prompt": "English ___ in more than fifty countries. ",
        "answers": [
          "is spoken"
        ],
        "cue": "speak",
        "explain": "Chủ ngữ số ít nên be chia thành is, còn động từ chuyển sang V3.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-2",
        "kind": "mcq",
        "prompt": "This bridge ___ in 1990.",
        "answers": [
          "was built"
        ],
        "options": [
          "was built",
          "was build",
          "built",
          "is built"
        ],
        "explain": "Mốc 1990 đã qua nên be chia ở quá khứ, và ngay sau đó là V3.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-3",
        "kind": "correct",
        "prompt": "The office cleaned every morning before eight.",
        "answers": [
          "is cleaned"
        ],
        "tokens": [
          "The",
          "office",
          "cleaned",
          "every",
          "morning",
          "before",
          "eight."
        ],
        "errIndex": 2,
        "explain": "Thiếu be thì câu quay về nghĩa chủ động, thành ra văn phòng tự đi dọn.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-4",
        "kind": "cloze",
        "prompt": "These shirts ___ in Viet Nam. ",
        "answers": [
          "are made"
        ],
        "cue": "make",
        "explain": "Chủ ngữ số nhiều nên dùng are, và make có V3 là made.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-5",
        "kind": "correct",
        "prompt": "My wallet was stole on the bus yesterday.",
        "answers": [
          "stolen"
        ],
        "tokens": [
          "My",
          "wallet",
          "was",
          "stole",
          "on",
          "the",
          "bus",
          "yesterday."
        ],
        "errIndex": 3,
        "explain": "steal có V3 là stolen; ghép was với V2 là lỗi rất hay gặp.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-6",
        "kind": "mcq",
        "prompt": "The letters ___ last Friday.",
        "answers": [
          "were sent"
        ],
        "options": [
          "were sent",
          "were send",
          "was sent",
          "sent"
        ],
        "explain": "Chủ ngữ số nhiều đi với were, và send có V3 là sent.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-7",
        "kind": "cloze",
        "prompt": "The room ___, so you can move in. ",
        "answers": [
          "has been cleaned"
        ],
        "cue": "clean",
        "explain": "Hiện tại hoàn thành bị động gồm has been cộng V3, nhấn vào tình trạng còn giữ tới bây giờ.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-8",
        "kind": "mcq",
        "prompt": "The results ___ on Friday morning.",
        "answers": [
          "will be announced"
        ],
        "options": [
          "will be announced",
          "will announced",
          "will announce",
          "are announce"
        ],
        "explain": "Sau will phải có be rồi mới tới V3, thiếu be là câu hỏng.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-9",
        "kind": "cloze",
        "prompt": "The road ___ at the moment.",
        "answers": [
          "is being repaired"
        ],
        "explain": "Việc đang diễn ra ở dạng bị động cần thêm being đứng trước V3.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-10",
        "kind": "cloze",
        "prompt": "By the time we arrived, all the food ___. ",
        "answers": [
          "had been eaten"
        ],
        "cue": "eat",
        "explain": "Việc xảy ra trước một mốc quá khứ nên be lùi về dạng had been.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-11",
        "kind": "mcq",
        "prompt": "Breakfast ___ between six and ten.",
        "answers": [
          "is served"
        ],
        "options": [
          "is served",
          "is serve",
          "serves",
          "is serving"
        ],
        "explain": "Đây là lịch cố định của khách sạn nên dùng hiện tại đơn bị động.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-12",
        "kind": "cloze",
        "prompt": "This form ___ by both parents. ",
        "answers": [
          "must be signed"
        ],
        "cue": "sign",
        "explain": "Sau modal, be giữ nguyên dạng gốc rồi mới tới V3.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-13",
        "kind": "correct",
        "prompt": "The homework must be do before Monday.",
        "answers": [
          "done"
        ],
        "tokens": [
          "The",
          "homework",
          "must",
          "be",
          "do",
          "before",
          "Monday."
        ],
        "errIndex": 4,
        "explain": "Sau be luôn là V3, không phải động từ nguyên thể.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-14",
        "kind": "mcq",
        "prompt": "The problem ___ in two ways.",
        "answers": [
          "can be solved"
        ],
        "options": [
          "can be solved",
          "can solved",
          "can be solve",
          "can is solved"
        ],
        "explain": "Modal giữ be ở dạng gốc và động từ chính ở cột V3.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-15",
        "kind": "cloze",
        "prompt": "This song was written ___ a nineteen-year-old student.",
        "answers": [
          "by"
        ],
        "explain": "by đứng trước người thực hiện hành động khi thông tin đó đáng nhắc tới.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-16",
        "kind": "cloze",
        "prompt": "The accident ___ near the market last night.",
        "answers": [
          "happened"
        ],
        "explain": "happen không có tân ngữ nên không có dạng bị động, dù tiếng Việt nói “bị xảy ra” vẫn xuôi.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-17",
        "kind": "mcq",
        "prompt": "The guests ___ at seven o'clock.",
        "answers": [
          "arrived"
        ],
        "options": [
          "arrived",
          "were arrived",
          "are arrived",
          "have been arrived"
        ],
        "explain": "arrive là nội động từ, khách tự đến chứ không ai làm việc đó lên họ.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-18",
        "kind": "cloze",
        "prompt": "Her grandfather ___ two years ago after a long illness. ",
        "answers": [
          "died"
        ],
        "cue": "die",
        "explain": "die không có tân ngữ nên luôn ở dạng chủ động.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-19",
        "kind": "mcq",
        "prompt": "We ___ a free map at the hotel.",
        "answers": [
          "were given"
        ],
        "options": [
          "were given",
          "were gave",
          "gave",
          "are giving"
        ],
        "explain": "Người nhận được đưa lên làm chủ ngữ, và give có V3 là given.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-20",
        "kind": "cloze",
        "prompt": "I ___ a new job last month. ",
        "answers": [
          "was offered"
        ],
        "cue": "offer",
        "explain": "Câu gốc có hai tân ngữ nên người nhận lên đứng đầu, còn vật vẫn ở lại phía sau.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-21",
        "kind": "cloze",
        "prompt": "It ___ that the old house is over two hundred years old. ",
        "answers": [
          "is said"
        ],
        "cue": "say",
        "explain": "Khuôn It is said that dùng khi không cần nêu ai là người nói.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-22",
        "kind": "cloze",
        "prompt": "He is said ___ one of the best coaches in the country.",
        "answers": [
          "to be"
        ],
        "explain": "Khi chủ ngữ đứng đầu là He thì phần sau phải chuyển thành to be.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-23",
        "kind": "cloze",
        "prompt": "I ___ my bike repaired yesterday because the brakes were broken.",
        "answers": [
          "had"
        ],
        "explain": "Khuôn have something done nói việc mình nhờ người khác làm chứ không tự làm.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-24",
        "kind": "mcq",
        "prompt": "She is going to ___ before the wedding.",
        "answers": [
          "have her hair cut"
        ],
        "options": [
          "have her hair cut",
          "have her hair cutted",
          "have cut her hair",
          "be her hair cut"
        ],
        "explain": "Trong khuôn have something done, tân ngữ đứng trước rồi mới tới V3.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-25",
        "kind": "correct",
        "prompt": "We should have the air conditioner check before summer.",
        "answers": [
          "checked"
        ],
        "tokens": [
          "We",
          "should",
          "have",
          "the",
          "air",
          "conditioner",
          "check",
          "before",
          "summer."
        ],
        "errIndex": 6,
        "explain": "Động từ đứng cuối khuôn have something done luôn ở cột V3.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-26",
        "kind": "transform",
        "prompt": "They built this bridge in 1990.",
        "answers": [
          "This bridge was built in 1990."
        ],
        "explain": "Tân ngữ lên làm chủ ngữ, động từ đổi thành was cộng V3.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-27",
        "kind": "transform",
        "prompt": "Someone stole my phone at the bus station.",
        "answers": [
          "My phone was stolen at the bus station."
        ],
        "explain": "Không rõ ai lấy nên bỏ hẳn phần by someone.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-28",
        "kind": "transform",
        "prompt": "The staff clean the rooms every morning.",
        "answers": [
          "The rooms are cleaned every morning."
        ],
        "explain": "Chủ ngữ mới ở số nhiều nên be chia thành are.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-29",
        "kind": "transform",
        "prompt": "You must finish the report before Friday.",
        "answers": [
          "The report must be finished before Friday."
        ],
        "explain": "Sau modal giữ be ở dạng gốc rồi mới tới V3.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-30",
        "kind": "transform",
        "prompt": "People say that this restaurant is the oldest in town.",
        "answers": [
          "It is said that this restaurant is the oldest in town."
        ],
        "explain": "Không cần nêu ai nói nên mở đầu bằng It is said that.",
        "errorTag": "Thiếu to be"
      },
      {
        "id": "passive-31",
        "kind": "transform",
        "prompt": "A mechanic is repairing my car at the moment.",
        "answers": [
          "My car is being repaired at the moment."
        ],
        "explain": "Thì tiếp diễn bị động cần thêm being trước V3.",
        "errorTag": "Thiếu to be"
      }
    ]
  },
  {
    "key": "relative-clauses",
    "builtin": true,
    "name": "Mệnh đề quan hệ",
    "nameEn": "Relative clauses",
    "level": "B1",
    "group": "Câu phức",
    "description": "Dùng cả một mệnh đề để nói rõ danh từ đứng trước là ai, là cái gì. Tiếng Việt bổ nghĩa bằng khuôn “mà… nó…” nên người học hay giữ lại một đại từ thừa ở cuối và đặt mệnh đề xa danh từ mà nó bổ nghĩa.",
    "icon": "layers",
    "tags": [
      "Trật tự từ"
    ],
    "signals": [
      "who",
      "whom",
      "which",
      "that",
      "whose",
      "where",
      "when",
      "why"
    ],
    "formulas": [
      {
        "form": "Bổ nghĩa cho người — làm chủ ngữ",
        "structure": "N (người) + who / that + V",
        "example": "The woman who lives next door is a nurse."
      },
      {
        "form": "Bổ nghĩa cho vật — làm chủ ngữ",
        "structure": "N (vật) + which / that + V",
        "example": "This is the phone which takes very clear photos."
      },
      {
        "form": "Đại từ quan hệ làm tân ngữ — bỏ được",
        "structure": "N + (who / which / that) + S + V",
        "example": "The book I bought last week is really useful."
      },
      {
        "form": "Chỉ quan hệ sở hữu",
        "structure": "N + whose + N + V",
        "example": "I met a girl whose brother works with my father."
      },
      {
        "form": "Chỉ nơi chốn, thời gian",
        "structure": "N + where / when + S + V",
        "example": "That is the café where we first met."
      },
      {
        "form": "Mệnh đề không xác định — có dấu phẩy",
        "structure": "N, who / which + V, …",
        "example": "My uncle, who lives in Hue, is coming tomorrow."
      },
      {
        "form": "Giới từ đứng trước đại từ quan hệ",
        "structure": "N + giới từ + which / whom + S + V",
        "example": "The colleague with whom I share an office is very quiet."
      }
    ],
    "uses": [
      {
        "name": "Nói rõ người nào",
        "sample": "The woman {who} lives next door is a nurse.",
        "note": "Danh từ đứng trước chỉ người và chỗ này làm chủ ngữ của mệnh đề. Có thể thay bằng that trong văn nói."
      },
      {
        "name": "Nói rõ vật nào",
        "sample": "I am reading the book {which} won the prize last year.",
        "note": "Danh từ đứng trước là vật nên dùng which hoặc that. Động từ won chia theo book."
      },
      {
        "name": "Đại từ quan hệ làm tân ngữ",
        "sample": "The film {that} we watched last night was too long.",
        "note": "Sau that đã có đủ chủ ngữ we và động từ watched, nên that là tân ngữ và bỏ đi câu vẫn đúng."
      },
      {
        "name": "Không lặp lại đại từ ở cuối",
        "sample": "This is the bag {which} I bought in Da Nang.",
        "note": "which đã đóng vai tân ngữ của bought rồi. Thêm it sau bought là nhắc chiếc túi hai lần."
      },
      {
        "name": "Chỉ ai sở hữu cái gì",
        "sample": "That is the student {whose} project won first prize.",
        "note": "whose nối người với thứ thuộc về người đó, và sau nó là danh từ trần, không có the."
      },
      {
        "name": "Chỉ nơi chốn",
        "sample": "This is the village {where} my grandparents grew up.",
        "note": "Mệnh đề phía sau đã đủ thành phần, phần còn thiếu chỉ là ý “ở đó”."
      },
      {
        "name": "Chỉ thời gian",
        "sample": "I still remember the day {when} we moved to Ha Noi.",
        "note": "Danh từ đứng trước chỉ thời điểm nên dùng when thay cho on that day."
      },
      {
        "name": "Thông tin thêm, không phân biệt",
        "sample": "My brother, {who} works in Da Nang, is getting married in May.",
        "note": "Người nghe đã biết đang nói về ai. Mệnh đề nằm giữa hai dấu phẩy và không được dùng that."
      },
      {
        "name": "which thay cho cả mệnh đề trước",
        "sample": "He forgot my birthday, {which} made me quite sad.",
        "note": "Thứ làm tôi buồn là toàn bộ việc anh ấy quên, chứ không phải riêng từ birthday."
      }
    ],
    "traps": [
      {
        "wrong": "The book which I bought it yesterday is very good.",
        "right": "The book which I bought yesterday is very good.",
        "why": "Tiếng Việt nói “quyển sách mà tôi mua nó hôm qua” nên người học giữ lại it. Trong tiếng Anh, which đã là tân ngữ của bought rồi."
      },
      {
        "wrong": "The man which lives upstairs is a teacher.",
        "right": "The man who lives upstairs is a teacher.",
        "why": "Tiếng Việt chỉ có một chữ “mà” cho cả người lẫn vật, còn tiếng Anh tách riêng who cho người và which cho vật."
      },
      {
        "wrong": "I have a friend who his father is a pilot.",
        "right": "I have a friend whose father is a pilot.",
        "why": "Tiếng Việt nói “người bạn mà bố của nó”, tách thành hai phần. Tiếng Anh gộp cả hai phần đó vào một từ duy nhất."
      },
      {
        "wrong": "That is the hotel where we stayed at last summer.",
        "right": "That is the hotel where we stayed last summer.",
        "why": "where đã mang sẵn nghĩa “ở đó” nên không cần thêm giới từ nữa. Người học dịch “khách sạn mà chúng tôi ở tại đó” nên viết thừa."
      },
      {
        "wrong": "The girl is very kind who helped me yesterday.",
        "right": "The girl who helped me yesterday is very kind.",
        "why": "Tiếng Việt cho phép đẩy phần “mà giúp tôi hôm qua” xuống cuối câu. Tiếng Anh bắt mệnh đề quan hệ phải đứng sát danh từ mà nó bổ nghĩa."
      },
      {
        "wrong": "My father, that works at a bank, is retiring soon.",
        "right": "My father, who works at a bank, is retiring soon.",
        "why": "Mệnh đề nằm giữa hai dấu phẩy chỉ bổ sung thông tin, và that không bao giờ được dùng trong loại mệnh đề này."
      },
      {
        "wrong": "Ha Noi which is the capital of Vietnam is very crowded.",
        "right": "Ha Noi, which is the capital of Vietnam, is very crowded.",
        "why": "Tên riêng đã xác định rồi nên phần phía sau chỉ là thông tin thêm và bắt buộc phải có dấu phẩy hai bên."
      }
    ],
    "compare": {
      "with": "Câu đơn có tính từ bổ nghĩa",
      "rows": [
        {
          "key": "Cách bổ nghĩa",
          "other": "Một tính từ đơn lẻ",
          "self": "Cả một mệnh đề có chủ ngữ và động từ riêng"
        },
        {
          "key": "Vị trí",
          "other": "Đứng trước danh từ: a quiet room",
          "self": "Đứng ngay sau danh từ: a room which faces the garden"
        },
        {
          "key": "Từ nối",
          "other": "Không cần từ nối nào",
          "self": "Cần who, which, that, whose, where — trừ khi nó làm tân ngữ"
        },
        {
          "key": "Động từ bên trong",
          "other": "Không có động từ riêng",
          "self": "Có động từ riêng, chia theo danh từ đứng trước"
        },
        {
          "key": "Ví dụ đối chiếu",
          "other": "I need a quiet room.",
          "self": "I need a room which faces the garden."
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Quen đặt phần bổ nghĩa sát danh từ nên viết a faces the garden room",
          "self": "Bê nguyên khuôn “mà… nó…” nên viết the room which I like it"
        }
      ]
    },
    "items": [
      {
        "id": "relative-clauses-1",
        "kind": "cloze",
        "prompt": "The woman ___ lives next door is a nurse.",
        "answers": [
          "who"
        ],
        "explain": "Danh từ đứng trước chỉ người và chỗ trống đang làm chủ ngữ cho động từ lives.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-2",
        "kind": "mcq",
        "prompt": "The girl ___ sits next to me is from Hue.",
        "answers": [
          "who"
        ],
        "options": [
          "who",
          "which",
          "whose",
          "where"
        ],
        "explain": "which dành cho vật, whose chỉ sở hữu, where chỉ nơi chốn — không ô nào hợp với một người làm chủ ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-3",
        "kind": "correct",
        "prompt": "The man which repaired my laptop was very friendly.",
        "answers": [
          "who"
        ],
        "tokens": [
          "The",
          "man",
          "which",
          "repaired",
          "my",
          "laptop",
          "was",
          "very",
          "friendly."
        ],
        "errIndex": 2,
        "explain": "Người sửa máy là một con người, không dùng đại từ dành cho đồ vật.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-4",
        "kind": "cloze",
        "prompt": "I am reading a book ___ explains how the brain works.",
        "answers": [
          "which"
        ],
        "explain": "Danh từ đứng trước là vật, và chỗ trống làm chủ ngữ cho động từ explains.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-5",
        "kind": "mcq",
        "prompt": "This is the phone ___ takes very clear photos.",
        "answers": [
          "which"
        ],
        "options": [
          "which",
          "who",
          "whose",
          "when"
        ],
        "explain": "Chiếc điện thoại là vật, mà mệnh đề lại đang nói nó làm gì nên cần đại từ chỉ vật ở vai chủ ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-6",
        "kind": "cloze",
        "prompt": "The people who ___ in that building share one lift. ",
        "answers": [
          "live"
        ],
        "cue": "live",
        "explain": "Động từ trong mệnh đề chia theo danh từ đứng trước, mà people luôn là số nhiều.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-7",
        "kind": "correct",
        "prompt": "The students who is waiting outside come from Da Nang.",
        "answers": [
          "are"
        ],
        "tokens": [
          "The",
          "students",
          "who",
          "is",
          "waiting",
          "outside",
          "come",
          "from",
          "Da",
          "Nang."
        ],
        "errIndex": 3,
        "explain": "Đại từ quan hệ thay cho students nên động từ phải ở dạng số nhiều.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-8",
        "kind": "mcq",
        "prompt": "The film ___ last night was too long.",
        "answers": [
          "that we watched"
        ],
        "options": [
          "that we watched",
          "that we watched it",
          "which we watched it",
          "what we watched"
        ],
        "explain": "Đại từ quan hệ đã thay cho bộ phim rồi, thêm it nữa là nhắc hai lần cùng một thứ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-9",
        "kind": "cloze",
        "prompt": "The dress which she bought ___ does not fit her.",
        "answers": [
          "yesterday"
        ],
        "explain": "Tiếng Việt nói “chiếc váy mà cô ấy mua nó hôm qua”, còn tiếng Anh không giữ lại đại từ đó.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-10",
        "kind": "cloze",
        "prompt": "Everything ___ you told me last night is still a secret.",
        "answers": [
          "that"
        ],
        "explain": "Sau everything, anything, nothing thì tiếng Anh dùng that chứ không dùng which.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-11",
        "kind": "mcq",
        "prompt": "Is there anything ___ I can do to help?",
        "answers": [
          "that"
        ],
        "options": [
          "that",
          "which",
          "what",
          "who"
        ],
        "explain": "Sau anything không dùng which, và what không bao giờ làm đại từ quan hệ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-12",
        "kind": "cloze",
        "prompt": "I have a friend ___ father is a pilot.",
        "answers": [
          "whose"
        ],
        "explain": "Chỗ trống nối người bạn với bố của người bạn, tức là một quan hệ sở hữu.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-13",
        "kind": "mcq",
        "prompt": "I know a man ___ car was stolen last week.",
        "answers": [
          "whose"
        ],
        "options": [
          "whose",
          "who",
          "which",
          "who is"
        ],
        "explain": "Chiếc xe thuộc về người đàn ông đó nên cần từ chỉ sở hữu, không phải đại từ chủ ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-14",
        "kind": "cloze",
        "prompt": "I have a cousin ___ wife is a dentist.",
        "answers": [
          "whose"
        ],
        "explain": "Tiếng Việt tách thành “người anh họ mà vợ của anh ấy”, còn tiếng Anh gộp cả hai phần vào một từ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-15",
        "kind": "cloze",
        "prompt": "That is the café ___ we first met.",
        "answers": [
          "where"
        ],
        "explain": "Danh từ đứng trước chỉ nơi chốn, và mệnh đề phía sau đã đủ chủ ngữ lẫn tân ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-16",
        "kind": "cloze",
        "prompt": "I still remember the day ___ we moved to Ha Noi.",
        "answers": [
          "when"
        ],
        "explain": "Danh từ đứng trước chỉ một mốc thời gian nên dùng trạng từ quan hệ tương ứng.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-17",
        "kind": "mcq",
        "prompt": "The house ___ we grew up has been sold.",
        "answers": [
          "where"
        ],
        "options": [
          "where",
          "which",
          "that",
          "who"
        ],
        "explain": "Mệnh đề phía sau không thiếu tân ngữ, nó chỉ thiếu phần chỉ nơi chốn.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-18",
        "kind": "correct",
        "prompt": "That is the restaurant which we had dinner last Friday.",
        "answers": [
          "where"
        ],
        "tokens": [
          "That",
          "is",
          "the",
          "restaurant",
          "which",
          "we",
          "had",
          "dinner",
          "last",
          "Friday."
        ],
        "errIndex": 4,
        "explain": "Câu phía sau đã đủ chủ ngữ và tân ngữ, phần còn thiếu chỉ là ý “ở đó”.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-19",
        "kind": "cloze",
        "prompt": "My uncle, ___ has just retired, is learning to paint.",
        "answers": [
          "who"
        ],
        "explain": "Đã có dấu phẩy và người nghe biết rõ đang nói về ai, nên đây chỉ là thông tin thêm.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-20",
        "kind": "mcq",
        "prompt": "My mother, ___ loves gardening, spends every morning outside.",
        "answers": [
          "who"
        ],
        "options": [
          "who",
          "that",
          "which",
          "whom"
        ],
        "explain": "Mệnh đề nằm giữa hai dấu phẩy thì không dùng that, và chỗ trống đang làm chủ ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-21",
        "kind": "correct",
        "prompt": "My brother, that works in Da Nang, is getting married in May.",
        "answers": [
          "who"
        ],
        "tokens": [
          "My",
          "brother,",
          "that",
          "works",
          "in",
          "Da",
          "Nang,",
          "is",
          "getting",
          "married",
          "in",
          "May."
        ],
        "errIndex": 2,
        "explain": "Trong mệnh đề không xác định, that không được dùng thay cho who.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-22",
        "kind": "cloze",
        "prompt": "She passed the exam, ___ surprised everybody.",
        "answers": [
          "which"
        ],
        "explain": "Thứ làm mọi người bất ngờ là cả sự việc phía trước chứ không phải riêng kỳ thi.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-23",
        "kind": "cloze",
        "prompt": "The colleague with ___ I share an office never speaks.",
        "answers": [
          "whom"
        ],
        "explain": "Ngay sau giới từ thì phải dùng dạng tân ngữ, who không đứng được ở vị trí này.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-24",
        "kind": "mcq",
        "prompt": "The teacher ___ we sent the email replied at once.",
        "answers": [
          "to whom"
        ],
        "options": [
          "to whom",
          "to who",
          "whom to",
          "to which"
        ],
        "explain": "Giới từ đưa lên trước thì phải đi kèm dạng tân ngữ, và người thì không dùng which.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-25",
        "kind": "cloze",
        "prompt": "The company ___ has offices in three countries.",
        "answers": [
          "which she works for"
        ],
        "explain": "Động từ work cần for mới nối được với company, bỏ giới từ là câu hụt nghĩa.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-26",
        "kind": "transform",
        "prompt": "I have a friend. He plays the violin very well.",
        "answers": [
          "I have a friend who plays the violin very well."
        ],
        "explain": "He nhắc lại chính người bạn đó nên khi gộp câu nó nhường chỗ cho đại từ quan hệ chỉ người.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-27",
        "kind": "transform",
        "prompt": "The bag is very expensive. She bought it in Da Nang.",
        "answers": [
          "The bag which she bought in Da Nang is very expensive."
        ],
        "explain": "Khi gộp câu, it biến mất vì đại từ quan hệ đã đảm nhiệm vai trò tân ngữ của bought.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-28",
        "kind": "transform",
        "prompt": "I know a boy. His mother is a famous singer.",
        "answers": [
          "I know a boy whose mother is a famous singer."
        ],
        "explain": "His là từ chỉ sở hữu, khi nối hai câu nó chuyển thành đại từ quan hệ sở hữu.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-29",
        "kind": "transform",
        "prompt": "That is the hotel. We stayed there last summer.",
        "answers": [
          "That is the hotel where we stayed last summer."
        ],
        "explain": "There chỉ nơi chốn nên khi gộp lại nó nhường chỗ cho where và không được giữ lại.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-30",
        "kind": "transform",
        "prompt": "My grandfather is eighty years old. He still swims every morning.",
        "answers": [
          "My grandfather, who is eighty years old, still swims every morning."
        ],
        "explain": "Người nghe đã biết ông là ai, nên phần tuổi tác chỉ là thông tin thêm và cần hai dấu phẩy.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "relative-clauses-31",
        "kind": "transform",
        "prompt": "He arrived two hours late. That annoyed everyone.",
        "answers": [
          "He arrived two hours late, which annoyed everyone."
        ],
        "explain": "That ở câu sau thay cho toàn bộ sự việc phía trước, khi gộp thì dùng which sau dấu phẩy.",
        "errorTag": "Trật tự từ"
      }
    ]
  },
  {
    "key": "verb-patterns",
    "builtin": true,
    "name": "Verb patterns & giới từ đi kèm",
    "nameEn": "Verb patterns and dependent prepositions",
    "level": "B1",
    "group": "Động từ & cấu trúc",
    "description": "Nhiều động từ tiếng Anh gắn chặt với một giới từ cố định, và sau giới từ thì động từ luôn ở dạng V-ing. Người Việt dịch thẳng “nghe nhạc”, “phụ thuộc vào”, “thảo luận về” nên hay bỏ giới từ ở chỗ cần có và thêm giới từ ở chỗ không cần.",
    "icon": "pen",
    "tags": [
      "Giới từ"
    ],
    "signals": [
      "depend on",
      "listen to",
      "look forward to",
      "interested in",
      "good at",
      "apologise to",
      "congratulate on",
      "accuse of",
      "insist on",
      "prevent from"
    ],
    "formulas": [
      {
        "form": "Động từ gắn với một giới từ cố định",
        "structure": "S + V + giới từ + N",
        "example": "The trip depends on the weather."
      },
      {
        "form": "Sau giới từ luôn là V-ing",
        "structure": "… + giới từ + V-ing",
        "example": "She is good at solving difficult problems."
      },
      {
        "form": "Động từ + tân ngữ + giới từ + tân ngữ",
        "structure": "S + V + O + giới từ + O",
        "example": "He apologised to me for being late."
      },
      {
        "form": "be + tính từ + giới từ",
        "structure": "S + be + adj + giới từ + N / V-ing",
        "example": "I am interested in learning Korean."
      },
      {
        "form": "Cụm ba phần kết thúc bằng to",
        "structure": "S + look forward to + V-ing",
        "example": "We look forward to hearing from you."
      },
      {
        "form": "Động từ không cần giới từ",
        "structure": "S + V + O (không có giới từ)",
        "example": "We discussed the budget for an hour."
      }
    ],
    "uses": [
      {
        "name": "Giới từ gắn chặt với động từ",
        "sample": "The trip depends {on} the weather.",
        "note": "depend luôn đi với on, không thay bằng in hay of. Coi cả cụm depend on là một từ khi học."
      },
      {
        "name": "Nghe ai, nghe cái gì",
        "sample": "I usually listen {to} music while I cook.",
        "note": "listen bắt buộc có to trước tân ngữ. Chỉ khi không nêu tân ngữ mới đứng một mình: Listen carefully."
      },
      {
        "name": "Sau giới từ dùng V-ing",
        "sample": "She is good at {solving} difficult problems.",
        "note": "at là giới từ nên động từ theo sau phải chuyển sang V-ing, không dùng dạng nguyên thể."
      },
      {
        "name": "to trong look forward to là giới từ",
        "sample": "We look forward to {meeting} you next week.",
        "note": "Đây không phải to của động từ nguyên thể mà là giới từ, nên sau nó vẫn là V-ing."
      },
      {
        "name": "Xin lỗi ai vì việc gì",
        "sample": "He apologised {to} his teacher {for} arriving late.",
        "note": "Người nhận lời xin lỗi đi sau to, còn lý do đi sau for. Thiếu một trong hai là câu lệch."
      },
      {
        "name": "Chúc mừng, buộc tội, đổ lỗi",
        "sample": "They congratulated her {on} passing the driving test.",
        "note": "Mỗi động từ có giới từ riêng: congratulate on, accuse of, blame for. Học theo cặp chứ không suy ra được."
      },
      {
        "name": "Ngăn ai khỏi việc gì",
        "sample": "The rain prevented us {from} finishing the match.",
        "note": "prevent luôn kèm from, và vì from là giới từ nên động từ sau nó ở dạng V-ing."
      },
      {
        "name": "Động từ tiếng Anh vốn không có giới từ",
        "sample": "We {discussed} the budget for nearly an hour.",
        "note": "Tiếng Việt nói “thảo luận về” nhưng discuss nhận thẳng tân ngữ. Cùng nhóm này còn có answer, mention, approach."
      },
      {
        "name": "Kết hôn, liên hệ, bước vào",
        "sample": "She {married} a colleague and later {contacted} her old boss.",
        "note": "marry, contact, enter đều nhận tân ngữ trực tiếp dù tiếng Việt có “với”, “cho”, “vào”."
      }
    ],
    "traps": [
      {
        "wrong": "We discussed about the new plan.",
        "right": "We discussed the new plan.",
        "why": "Tiếng Việt luôn nói “thảo luận về” nên người học thêm about. Trong tiếng Anh, nghĩa “về” đã nằm sẵn trong discuss."
      },
      {
        "wrong": "I listen music every evening.",
        "right": "I listen to music every evening.",
        "why": "Tiếng Việt nói “nghe nhạc” không cần từ nối nào, còn listen bắt buộc phải có to trước tân ngữ."
      },
      {
        "wrong": "Everything depends in the weather.",
        "right": "Everything depends on the weather.",
        "why": "Người học dịch chữ “vào” trong “phụ thuộc vào” thành in. Giới từ của depend là on và không suy ra được từ tiếng Việt."
      },
      {
        "wrong": "I am looking forward to see you again.",
        "right": "I am looking forward to seeing you again.",
        "why": "Thấy to là người học nghĩ ngay tới động từ nguyên thể. Ở đây to là giới từ, nên phía sau phải là V-ing."
      },
      {
        "wrong": "She apologised me for being late.",
        "right": "She apologised to me for being late.",
        "why": "Tiếng Việt nói “xin lỗi tôi” không cần từ nối, nhưng apologise không nhận thẳng người mà phải qua to."
      },
      {
        "wrong": "He married with a doctor from Hue.",
        "right": "He married a doctor from Hue.",
        "why": "Tiếng Việt nói “kết hôn với” nên người học thêm with. marry nhận thẳng tân ngữ, chỉ be married mới đi với to."
      },
      {
        "wrong": "We entered into the room quietly.",
        "right": "We entered the room quietly.",
        "why": "Chữ “vào” trong “bước vào phòng” khiến người học thêm into. enter đã đủ nghĩa, chỉ enter into dùng cho hợp đồng, thoả thuận."
      }
    ],
    "compare": {
      "with": "Động từ đứng một mình",
      "rows": [
        {
          "key": "Cấu tạo",
          "other": "Động từ nhận thẳng tân ngữ",
          "self": "Động từ + giới từ cố định rồi mới tới tân ngữ"
        },
        {
          "key": "Bỏ giới từ được không",
          "other": "Không có giới từ nào để bỏ",
          "self": "Giới từ là một phần của động từ, bỏ đi là sai"
        },
        {
          "key": "Từ đứng sau",
          "other": "Danh từ, hoặc to V tuỳ động từ",
          "self": "Danh từ hoặc V-ing, không bao giờ là to V"
        },
        {
          "key": "Nhóm hay gặp",
          "other": "discuss, answer, marry, mention, approach, contact, enter",
          "self": "depend on, listen to, insist on, succeed in, accuse of, thank for"
        },
        {
          "key": "Ví dụ đối chiếu",
          "other": "We discussed the plan yesterday.",
          "self": "We talked about the plan yesterday."
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Dịch “thảo luận về” nên thêm about vào sau discuss",
          "self": "Dịch “nghe nhạc” nên bỏ mất to sau listen"
        }
      ]
    },
    "items": [
      {
        "id": "verb-patterns-1",
        "kind": "cloze",
        "prompt": "The picnic depends ___ the weather this weekend.",
        "answers": [
          "on"
        ],
        "explain": "depend chỉ đi với một giới từ duy nhất, và đó không phải giới từ dịch từ chữ “vào”.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-2",
        "kind": "mcq",
        "prompt": "It all depends ___ how much time we have.",
        "answers": [
          "on"
        ],
        "options": [
          "on",
          "in",
          "of",
          "to"
        ],
        "explain": "Cả cụm là một khối cố định, đổi giới từ là câu hỏng dù nghĩa tiếng Việt vẫn xuôi.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-3",
        "kind": "correct",
        "prompt": "Everything depends in the traffic tomorrow morning.",
        "answers": [
          "on"
        ],
        "tokens": [
          "Everything",
          "depends",
          "in",
          "the",
          "traffic",
          "tomorrow",
          "morning."
        ],
        "errIndex": 2,
        "explain": "Người học dịch chữ “vào” thành in, nhưng giới từ của depend không liên quan tới nghĩa tiếng Việt.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-4",
        "kind": "cloze",
        "prompt": "I always listen ___ the news while I am cooking.",
        "answers": [
          "to"
        ],
        "explain": "Khi có tân ngữ phía sau, listen bắt buộc phải nối bằng một giới từ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-5",
        "kind": "mcq",
        "prompt": "I never listen ___ when I study.",
        "answers": [
          "to music"
        ],
        "options": [
          "to music",
          "music",
          "at music",
          "for music"
        ],
        "explain": "listen at và listen for đều lệch nghĩa, còn bỏ hẳn giới từ thì câu không nối được với tân ngữ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-6",
        "kind": "correct",
        "prompt": "My father likes to listen music in the car.",
        "answers": [
          "to music"
        ],
        "tokens": [
          "My",
          "father",
          "likes",
          "to",
          "listen",
          "music",
          "in",
          "the",
          "car."
        ],
        "errIndex": 5,
        "explain": "Tiếng Việt nói “nghe nhạc” liền một mạch nên người học quên mất từ nối bắt buộc.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-7",
        "kind": "mcq",
        "prompt": "We ___ for two hours.",
        "answers": [
          "discussed the report"
        ],
        "options": [
          "discussed the report",
          "discussed about the report",
          "discussed on the report",
          "talked the report"
        ],
        "explain": "Nghĩa “về” đã nằm trong bản thân discuss, còn talk thì ngược lại, phải có about.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-8",
        "kind": "cloze",
        "prompt": "We ___ the new timetable this morning.",
        "answers": [
          "discussed"
        ],
        "explain": "Câu tiếng Việt “thảo luận về lịch mới” khiến người học thêm một giới từ thừa.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-9",
        "kind": "mcq",
        "prompt": "My sister ___ last spring.",
        "answers": [
          "married a teacher"
        ],
        "options": [
          "married a teacher",
          "married with a teacher",
          "married to a teacher",
          "got married a teacher"
        ],
        "explain": "Chỉ dạng be married mới đi với to, còn động từ marry nhận thẳng người.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-10",
        "kind": "cloze",
        "prompt": "My brother married ___ from his hometown.",
        "answers": [
          "a nurse"
        ],
        "explain": "Chữ “với” trong “kết hôn với” không có bản dịch tương ứng trong cấu trúc tiếng Anh này.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-11",
        "kind": "cloze",
        "prompt": "She is very good at ___ problems under pressure. ",
        "answers": [
          "solving"
        ],
        "cue": "solve",
        "explain": "at là giới từ nên động từ theo sau phải đổi dạng, không giữ nguyên thể.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-12",
        "kind": "cloze",
        "prompt": "I am not interested ___ working at the weekend.",
        "answers": [
          "in"
        ],
        "explain": "Tính từ interested luôn kéo theo một giới từ cố định trước khi tới việc được nhắc đến.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-13",
        "kind": "cloze",
        "prompt": "They are interested ___ Korean this year.",
        "answers": [
          "in learning"
        ],
        "explain": "Giới từ đã đúng, nhưng động từ đứng ngay sau giới từ thì không được để nguyên thể.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-14",
        "kind": "cloze",
        "prompt": "Thank you for ___ me with the presentation. ",
        "answers": [
          "helping"
        ],
        "cue": "help",
        "explain": "Sau for phải là V-ing, dù tiếng Việt nói “cảm ơn vì đã giúp” nghe như một động từ thường.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-15",
        "kind": "cloze",
        "prompt": "We are looking forward to ___ your family next month. ",
        "answers": [
          "meeting"
        ],
        "cue": "meet",
        "explain": "to ở cuối look forward to là giới từ chứ không phải dấu hiệu của động từ nguyên thể.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-16",
        "kind": "mcq",
        "prompt": "She is looking forward ___ her cousins.",
        "answers": [
          "to seeing"
        ],
        "options": [
          "to seeing",
          "to see",
          "for seeing",
          "to saw"
        ],
        "explain": "Cụm này cố định ở dạng to, và vì to là giới từ nên phía sau là V-ing.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-17",
        "kind": "cloze",
        "prompt": "I am looking forward ___ from you soon.",
        "answers": [
          "to hearing"
        ],
        "explain": "Đây là lỗi phổ biến nhất trong email tiếng Anh của người Việt: nhầm to giới từ với to nguyên thể.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-18",
        "kind": "cloze",
        "prompt": "He apologised ___ his manager for the long delay.",
        "answers": [
          "to"
        ],
        "explain": "Người nhận lời xin lỗi không đứng thẳng sau apologise mà phải qua một giới từ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-19",
        "kind": "mcq",
        "prompt": "He ___ being rude.",
        "answers": [
          "apologised to me for"
        ],
        "options": [
          "apologised to me for",
          "apologised me for",
          "apologised me about",
          "apologised with me for"
        ],
        "explain": "Cấu trúc đầy đủ cần hai giới từ: một dẫn tới người, một dẫn tới lý do.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-20",
        "kind": "correct",
        "prompt": "She apologised me for forgetting my birthday.",
        "answers": [
          "to me"
        ],
        "tokens": [
          "She",
          "apologised",
          "me",
          "for",
          "forgetting",
          "my",
          "birthday."
        ],
        "errIndex": 2,
        "explain": "Tiếng Việt nói “xin lỗi tôi” liền nhau nên người học bỏ mất từ nối giữa động từ và người.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-21",
        "kind": "mcq",
        "prompt": "They congratulated me ___ winning the competition.",
        "answers": [
          "on"
        ],
        "options": [
          "on",
          "for",
          "about",
          "with"
        ],
        "explain": "congratulate có giới từ riêng, không mượn được giới từ của thank hay apologise.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-22",
        "kind": "mcq",
        "prompt": "The police accused him ___ the money.",
        "answers": [
          "of stealing"
        ],
        "options": [
          "of stealing",
          "for stealing",
          "to steal",
          "of steal"
        ],
        "explain": "accuse đi với of, và vì of là giới từ nên hành vi bị cáo buộc ở dạng V-ing.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-23",
        "kind": "cloze",
        "prompt": "Nobody blamed the driver ___ the accident.",
        "answers": [
          "for"
        ],
        "explain": "Người bị đổ lỗi đứng thẳng sau blame, còn lý do mới cần giới từ dẫn vào.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-24",
        "kind": "cloze",
        "prompt": "She insisted ___ paying for the whole meal.",
        "answers": [
          "on"
        ],
        "explain": "insist luôn kèm một giới từ, và việc được nhấn mạnh theo sau ở dạng V-ing.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-25",
        "kind": "cloze",
        "prompt": "The bad weather prevented us ___ landing on time.",
        "answers": [
          "from"
        ],
        "explain": "prevent tách làm hai phần: người bị ngăn đứng ngay sau, việc bị ngăn đi sau giới từ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-26",
        "kind": "cloze",
        "prompt": "They finally succeeded ___ getting a visa.",
        "answers": [
          "in"
        ],
        "explain": "succeed không nhận thẳng việc làm được mà phải nối qua một giới từ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-27",
        "kind": "transform",
        "prompt": "We talked about the problem for an hour.",
        "answers": [
          "We discussed the problem for an hour."
        ],
        "explain": "talk cần about, còn discuss thì ngược lại, thêm about vào là thừa.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-28",
        "kind": "transform",
        "prompt": "I want to hear from you soon.",
        "answers": [
          "I am looking forward to hearing from you soon."
        ],
        "explain": "Khi chuyển sang cụm look forward to, động từ hear phải đổi dạng vì to ở đây là giới từ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-29",
        "kind": "transform",
        "prompt": "He was sorry that he had shouted at his sister.",
        "answers": [
          "He apologised to his sister for shouting at her."
        ],
        "explain": "Người nhận lời xin lỗi đi sau to, còn hành vi gây lỗi đi sau for ở dạng V-ing.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-30",
        "kind": "transform",
        "prompt": "Everyone said congratulations to her when she passed the driving test.",
        "answers": [
          "Everyone congratulated her on passing the driving test."
        ],
        "explain": "Người được chúc mừng đứng thẳng sau động từ, chỉ lý do mới cần giới từ dẫn vào.",
        "errorTag": "Giới từ"
      },
      {
        "id": "verb-patterns-31",
        "kind": "transform",
        "prompt": "The rain was so heavy that we could not finish the match.",
        "answers": [
          "The heavy rain prevented us from finishing the match."
        ],
        "explain": "prevent chèn người bị ngăn vào giữa, rồi mới tới from và động từ ở dạng V-ing.",
        "errorTag": "Giới từ"
      }
    ]
  },
  {
    "key": "phrasal-verbs",
    "builtin": true,
    "name": "Phrasal verbs thông dụng",
    "nameEn": "Common phrasal verbs",
    "level": "B1",
    "group": "Động từ & cấu trúc",
    "description": "Động từ ghép với một hoặc hai tiểu từ, nghĩa của cả cụm thường khác hẳn nghĩa từng từ. Người Việt quen mỗi động từ một nghĩa nên hay thay bằng từ trang trọng cho an toàn, và đặt sai vị trí đại từ khi viết turn off it thay vì turn it off.",
    "icon": "layers",
    "tags": [
      "Giới từ"
    ],
    "signals": [
      "give up",
      "find out",
      "take off",
      "put off",
      "look after",
      "look up",
      "come across",
      "put up with",
      "turn down",
      "get on with"
    ],
    "formulas": [
      {
        "form": "Cụm không có tân ngữ",
        "structure": "S + V + tiểu từ",
        "example": "My old car broke down again yesterday."
      },
      {
        "form": "Cụm tách được — tân ngữ là danh từ",
        "structure": "S + V + tiểu từ + O, hoặc S + V + O + tiểu từ",
        "example": "Please turn off the lights. Hoặc: Please turn the lights off."
      },
      {
        "form": "Cụm tách được — tân ngữ là đại từ",
        "structure": "S + V + O (đại từ) + tiểu từ",
        "example": "The radio is too loud. Please turn it off."
      },
      {
        "form": "Cụm không tách được",
        "structure": "S + V + tiểu từ + O",
        "example": "She looks after her grandmother every weekend."
      },
      {
        "form": "Cụm ba phần",
        "structure": "S + V + tiểu từ + giới từ + O",
        "example": "I cannot put up with this noise any longer."
      },
      {
        "form": "Động từ theo sau cụm ở dạng V-ing",
        "structure": "S + V + tiểu từ + V-ing",
        "example": "He gave up smoking two years ago."
      }
    ],
    "uses": [
      {
        "name": "Nghĩa cả cụm khác nghĩa từng từ",
        "sample": "The meeting was {put off} until Friday.",
        "note": "put là “đặt”, off là “tắt, rời ra”, nhưng cả cụm lại có nghĩa là hoãn. Phải học nguyên khối chứ không ghép nghĩa được."
      },
      {
        "name": "Tân ngữ là danh từ thì đặt đâu cũng được",
        "sample": "Please {turn off} the television before you leave.",
        "note": "Với cụm tách được, danh từ có thể đứng sau tiểu từ hoặc chen vào giữa: turn the television off cũng đúng."
      },
      {
        "name": "Tân ngữ là đại từ thì bắt buộc chen vào giữa",
        "sample": "The radio is too loud, so please {turn it off}.",
        "note": "it, them, him, her luôn nằm giữa động từ và tiểu từ. Viết turn off it là sai, không có ngoại lệ."
      },
      {
        "name": "Cụm không tách được",
        "sample": "She {looks after} her grandmother every weekend.",
        "note": "look after, run into, get over không cho phép chen tân ngữ vào giữa, kể cả khi đó là đại từ."
      },
      {
        "name": "Cụm ba phần",
        "sample": "I cannot {put up with} this noise any longer.",
        "note": "Ba phần đi liền một khối và tân ngữ luôn nằm phía sau cùng. Thiếu with là câu chưa trọn."
      },
      {
        "name": "Gặp tình cờ, tìm ra tình cờ",
        "sample": "I {came across} an old photo of my parents.",
        "note": "come across mang nghĩa tình cờ bắt gặp, khác hẳn look for là chủ động đi tìm."
      },
      {
        "name": "Cụm không cần tân ngữ",
        "sample": "Our car {broke down} on the way to Sa Pa.",
        "note": "break down tự nó đã đủ nghĩa. Không dùng dạng bị động dù tiếng Việt nói “xe bị hỏng”."
      },
      {
        "name": "Từ chối, hạ nhỏ xuống",
        "sample": "She {turned down} the job because of the salary.",
        "note": "turn down vừa nghĩa từ chối vừa nghĩa vặn nhỏ, hiểu theo tân ngữ đi kèm. Đây là cụm tách được."
      },
      {
        "name": "Động từ theo sau ở dạng V-ing",
        "sample": "He {gave up} eating sugar last January.",
        "note": "up là tiểu từ nên động từ tiếp theo phải chuyển sang V-ing, không dùng to V."
      }
    ],
    "traps": [
      {
        "wrong": "Please turn off it before you leave.",
        "right": "Please turn it off before you leave.",
        "why": "Tiếng Việt nói “tắt nó đi”, tức là tân ngữ đứng ngay sau động từ. Trong cụm tách được, đại từ phải nằm giữa động từ và tiểu từ."
      },
      {
        "wrong": "I cannot put up this noise any longer.",
        "right": "I cannot put up with this noise any longer.",
        "why": "Người học nhớ được hai phần đầu rồi dừng lại. Cụm ba phần phải đủ cả ba thì tân ngữ mới nối vào được."
      },
      {
        "wrong": "He gave up to smoke two years ago.",
        "right": "He gave up smoking two years ago.",
        "why": "Tiếng Việt nói “bỏ hút thuốc” nối hai động từ liền nhau. Sau tiểu từ up thì động từ phải ở dạng V-ing."
      },
      {
        "wrong": "Our car was broken down on the way to Sa Pa.",
        "right": "Our car broke down on the way to Sa Pa.",
        "why": "Chữ “bị” trong “xe bị hỏng” khiến người học dựng câu bị động. break down đã tự mang nghĩa hỏng, không cần be."
      },
      {
        "wrong": "We must carry on the plan next Monday.",
        "right": "We must carry out the plan next Monday.",
        "why": "Đổi một tiểu từ là đổi hẳn nghĩa: carry on là tiếp tục, còn thực hiện một kế hoạch phải là carry out."
      },
      {
        "wrong": "I came across with an old friend at the station.",
        "right": "I came across an old friend at the station.",
        "why": "Tiếng Việt nói “tình cờ gặp với ai đó” nên người học thêm with. Cụm này đã đủ nghĩa và nhận thẳng tân ngữ."
      },
      {
        "wrong": "She looks after for her grandmother every weekend.",
        "right": "She looks after her grandmother every weekend.",
        "why": "Người học thấy after ngắn quá nên thêm một giới từ nữa cho chắc. look after là khối cố định, không chèn thêm gì."
      }
    ],
    "compare": {
      "with": "Động từ đơn tương đương",
      "rows": [
        {
          "key": "Cấu tạo",
          "other": "Một từ duy nhất",
          "self": "Động từ cộng một hoặc hai tiểu từ, hiểu như một khối"
        },
        {
          "key": "Sắc thái",
          "other": "Trang trọng, hay gặp trong văn viết và báo chí",
          "self": "Đời thường, chiếm phần lớn hội thoại hằng ngày"
        },
        {
          "key": "Vị trí tân ngữ",
          "other": "Luôn đứng ngay sau động từ",
          "self": "Với cụm tách được, đại từ bắt buộc chen vào giữa"
        },
        {
          "key": "Đoán nghĩa",
          "other": "Nghĩa nằm sẵn trong từ",
          "self": "Nghĩa cả cụm thường không suy ra được từ từng từ"
        },
        {
          "key": "Ví dụ đối chiếu",
          "other": "Please postpone the meeting.",
          "self": "Please put the meeting off."
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Chọn từ trang trọng cho an toàn nên câu nói nghe cứng và xa lạ",
          "self": "Viết turn off it thay vì turn it off, hoặc đổi tiểu từ làm lệch hẳn nghĩa"
        }
      ]
    },
    "items": [
      {
        "id": "phrasal-verbs-1",
        "kind": "cloze",
        "prompt": "Our car broke ___ on the way to Sa Pa.",
        "answers": [
          "down"
        ],
        "explain": "break đi với tiểu từ chỉ hướng xuống mới mang nghĩa hỏng máy giữa đường.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-2",
        "kind": "mcq",
        "prompt": "The washing machine ___ again last night.",
        "answers": [
          "broke down"
        ],
        "options": [
          "broke down",
          "broke up",
          "broke off",
          "broke into"
        ],
        "explain": "broke up là chia tay hoặc tan rã, broke into là đột nhập — chỉ một lựa chọn nói về máy móc hỏng.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-3",
        "kind": "cloze",
        "prompt": "The lift ___ again this morning.",
        "answers": [
          "broke down"
        ],
        "explain": "Chữ “bị” trong “thang máy bị hỏng” khiến người học dựng câu bị động không cần thiết.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-4",
        "kind": "cloze",
        "prompt": "The plane took ___ twenty minutes late.",
        "answers": [
          "off"
        ],
        "explain": "Cùng động từ take nhưng đổi tiểu từ là đổi nghĩa, và cất cánh là rời khỏi mặt đất.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-5",
        "kind": "mcq",
        "prompt": "Please ___ before the film starts.",
        "answers": [
          "turn it off"
        ],
        "options": [
          "turn it off",
          "turn off it",
          "off turn it",
          "turn off him"
        ],
        "explain": "Đại từ không bao giờ được đẩy ra sau tiểu từ trong cụm tách được.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-6",
        "kind": "cloze",
        "prompt": "The music is too loud, so can you turn ___?",
        "answers": [
          "it down"
        ],
        "explain": "Tiếng Việt nói “vặn nhỏ nó lại” nên người học đặt đại từ ngay sau động từ và tiểu từ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-7",
        "kind": "mcq",
        "prompt": "Can you ___ in the dictionary?",
        "answers": [
          "look it up"
        ],
        "options": [
          "look it up",
          "look up it",
          "look for it up",
          "up look it"
        ],
        "explain": "look up là cụm tách được, mà tân ngữ ở đây là đại từ nên chỉ có một vị trí hợp lệ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-8",
        "kind": "cloze",
        "prompt": "My grandparents brought ___ five children in a small house.",
        "answers": [
          "up"
        ],
        "explain": "bring cộng tiểu từ này mang nghĩa nuôi nấng, khác hẳn nghĩa mang tới của bring.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-9",
        "kind": "cloze",
        "prompt": "My parents brought ___ in a small village near Hue.",
        "answers": [
          "me up"
        ],
        "explain": "Tân ngữ là đại từ nên bắt buộc chen vào giữa, dù danh từ thì đặt hai chỗ đều được.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-10",
        "kind": "cloze",
        "prompt": "She looks ___ her grandmother every weekend.",
        "answers": [
          "after"
        ],
        "explain": "look for là đi tìm, còn chăm sóc ai đó cần một tiểu từ khác hẳn.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-11",
        "kind": "mcq",
        "prompt": "I will ___ my niece while my sister is at work.",
        "answers": [
          "look after"
        ],
        "options": [
          "look after",
          "look for",
          "look up",
          "look into"
        ],
        "explain": "Ba lựa chọn còn lại lần lượt là tìm kiếm, tra cứu và điều tra, không lựa chọn nào là trông nom.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-12",
        "kind": "cloze",
        "prompt": "Who is going to look ___ the dog while you are away?",
        "answers": [
          "after"
        ],
        "explain": "Cụm này đã trọn nghĩa, thêm một giới từ nữa là chèn vào giữa khối cố định.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-13",
        "kind": "cloze",
        "prompt": "I came ___ an old photo of my parents yesterday.",
        "answers": [
          "across"
        ],
        "explain": "Cụm này nhấn vào việc bắt gặp ngoài dự tính, không phải chủ động đi tìm.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-14",
        "kind": "cloze",
        "prompt": "I came ___ an old friend at the station.",
        "answers": [
          "across"
        ],
        "explain": "Chữ “với” trong “gặp với ai đó” là thói quen tiếng Việt, cụm này nhận thẳng tân ngữ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-15",
        "kind": "cloze",
        "prompt": "I cannot put up ___ the noise from the street.",
        "answers": [
          "with"
        ],
        "explain": "Đây là cụm ba phần, thiếu phần cuối thì tân ngữ không nối vào được.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-16",
        "kind": "mcq",
        "prompt": "I cannot ___ his complaining any longer.",
        "answers": [
          "put up with"
        ],
        "options": [
          "put up with",
          "put up",
          "put with",
          "put on with"
        ],
        "explain": "Cả ba phần đi liền một khối và không được rút gọn hay đảo thứ tự.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-17",
        "kind": "cloze",
        "prompt": "She gets on ___ everyone in the office.",
        "answers": [
          "with"
        ],
        "explain": "get on nếu đứng một mình là lên xe, phải có phần thứ ba mới thành nghĩa hoà hợp với ai.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-18",
        "kind": "cloze",
        "prompt": "He gave ___ smoking two years ago.",
        "answers": [
          "up"
        ],
        "explain": "give away là cho đi, give in là chịu thua, còn từ bỏ một thói quen cần tiểu từ khác.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-19",
        "kind": "cloze",
        "prompt": "She finally gave up ___ to fix the old printer. ",
        "answers": [
          "trying"
        ],
        "cue": "try",
        "explain": "Sau tiểu từ của cụm này, động từ tiếp theo phải chuyển sang dạng V-ing.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-20",
        "kind": "cloze",
        "prompt": "He gave up ___ after his doctor's warning.",
        "answers": [
          "smoking"
        ],
        "explain": "Tiếng Việt nối “bỏ hút thuốc” liền mạch nên người học giữ nguyên dạng nguyên thể.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-21",
        "kind": "cloze",
        "prompt": "The meeting has been put ___ until Friday.",
        "answers": [
          "off"
        ],
        "explain": "put on là mặc vào, put up là dựng lên, còn hoãn lại cần một tiểu từ khác.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-22",
        "kind": "cloze",
        "prompt": "I need to find ___ how much the tickets cost.",
        "answers": [
          "out"
        ],
        "explain": "find là tìm thấy một vật, còn tìm ra một thông tin thì cần thêm tiểu từ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-23",
        "kind": "mcq",
        "prompt": "They ___ my application because I have no experience.",
        "answers": [
          "turned down"
        ],
        "options": [
          "turned down",
          "turned off",
          "turned up",
          "turned over"
        ],
        "explain": "turned up là xuất hiện, turned over là lật lại — chỉ một lựa chọn mang nghĩa từ chối.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-24",
        "kind": "mcq",
        "prompt": "We need to ___ the survey before June.",
        "answers": [
          "carry out"
        ],
        "options": [
          "carry out",
          "carry on",
          "carry off",
          "carry up"
        ],
        "explain": "carry on là tiếp tục việc đang dở, còn tiến hành một cuộc khảo sát là nghĩa khác hẳn.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-25",
        "kind": "mcq",
        "prompt": "She ___ her own company three years ago.",
        "answers": [
          "set up"
        ],
        "options": [
          "set up",
          "set off",
          "set in",
          "set out"
        ],
        "explain": "set off là khởi hành, set in là bắt đầu kéo dài — thành lập công ty cần lựa chọn còn lại.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-26",
        "kind": "cloze",
        "prompt": "We must ___ the plan next Monday.",
        "answers": [
          "carry out"
        ],
        "explain": "Hai cụm chỉ khác nhau một tiểu từ nhưng một bên là tiếp tục, một bên là thực hiện.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-27",
        "kind": "transform",
        "prompt": "The concert was postponed until next month.",
        "answers": [
          "The concert was put off until next month."
        ],
        "explain": "postpone là từ trang trọng, cách nói đời thường thay bằng một cụm hai từ tương đương.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-28",
        "kind": "transform",
        "prompt": "She refused the job offer because of the salary.",
        "answers": [
          "She turned down the job offer because of the salary."
        ],
        "explain": "Tân ngữ là danh từ nên vẫn đặt được sau tiểu từ, không bắt buộc chen vào giữa.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-29",
        "kind": "transform",
        "prompt": "Please continue reading while I answer the phone.",
        "answers": [
          "Please carry on reading while I answer the phone."
        ],
        "explain": "continue đổi thành cụm tương đương, và động từ theo sau vẫn giữ dạng V-ing.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-30",
        "kind": "transform",
        "prompt": "I cannot tolerate this noise any longer.",
        "answers": [
          "I cannot put up with this noise any longer."
        ],
        "explain": "tolerate là một từ, còn cách nói thông dụng cần đủ ba phần rồi mới tới tân ngữ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "phrasal-verbs-31",
        "kind": "transform",
        "prompt": "My aunt raised three children on her own.",
        "answers": [
          "My aunt brought up three children on her own."
        ],
        "explain": "raise trong nghĩa nuôi con được thay bằng cụm hai từ, tân ngữ danh từ vẫn đứng sau tiểu từ.",
        "errorTag": "Giới từ"
      }
    ]
  },
  {
    "key": "conditionals",
    "builtin": true,
    "name": "Câu điều kiện",
    "nameEn": "Conditional sentences",
    "level": "B2",
    "group": "Câu phức",
    "description": "Nêu một điều kiện và kết quả của nó. Tiếng Việt chỉ có một khuôn “nếu… thì…” cho mọi tình huống nên người học hay dịch thẳng ra loại 1, bỏ mất bước lùi thì đánh dấu “chuyện này không có thật”.",
    "icon": "shuffle",
    "tags": [
      "Nhầm thì"
    ],
    "signals": [
      "if",
      "unless",
      "as long as",
      "provided that",
      "in case",
      "otherwise",
      "wish",
      "if only",
      "were",
      "had"
    ],
    "formulas": [
      {
        "form": "Loại 0 — sự thật luôn đúng",
        "structure": "If + S + V hiện tại, S + V hiện tại",
        "example": "If you heat water to 100 degrees, it boils."
      },
      {
        "form": "Loại 1 — có thể xảy ra",
        "structure": "If + S + V hiện tại, S + will + V",
        "example": "If it rains tomorrow, we will cancel the picnic."
      },
      {
        "form": "Loại 2 — trái với hiện tại",
        "structure": "If + S + V quá khứ / were, S + would + V",
        "example": "If I had more free time, I would learn the guitar."
      },
      {
        "form": "Loại 3 — trái với quá khứ",
        "structure": "If + S + had + V3, S + would have + V3",
        "example": "If she had studied harder, she would have passed the exam."
      },
      {
        "form": "Hỗn hợp — quá khứ sang hiện tại",
        "structure": "If + S + had + V3, S + would + V",
        "example": "If I had saved more money last year, I would be on holiday now."
      },
      {
        "form": "Đảo ngữ — văn trang trọng",
        "structure": "Were / Had + S…, S + would…",
        "example": "Had I known about the traffic, I would have taken the train."
      }
    ],
    "uses": [
      {
        "name": "Quy luật, sự thật hiển nhiên",
        "sample": "If you {heat} ice, it {melts}.",
        "note": "Loại 0 — hễ có điều kiện là có kết quả, không bàn tới chuyện thật hay giả. Hai vế đều hiện tại đơn."
      },
      {
        "name": "Việc có khả năng xảy ra",
        "sample": "If it {rains} tomorrow, we {will cancel} the picnic.",
        "note": "Loại 1 — điều kiện có thật trong tương lai. Vế if vẫn dùng hiện tại đơn dù nghĩa là tương lai."
      },
      {
        "name": "Giả định trái với hiện tại",
        "sample": "If I {had} a car, I {would drive} you to the airport.",
        "note": "Loại 2 — sự thật là tôi không có xe. Lùi một thì để đánh dấu “không có thật”."
      },
      {
        "name": "Tiếc nuối một việc đã qua",
        "sample": "If she {had read} the instructions, she {would not have made} that mistake.",
        "note": "Loại 3 — chuyện đã rồi, không sửa được nữa. Cả hai vế đều lùi về quá khứ hoàn thành."
      },
      {
        "name": "Hậu quả hiện tại của việc quá khứ",
        "sample": "If I {had saved} more money last year, I {would be} on holiday now.",
        "note": "Hỗn hợp — điều kiện nằm ở quá khứ nhưng kết quả nói về hiện tại, nên vế chính chỉ có would + V."
      },
      {
        "name": "Khuyên nhủ lịch sự",
        "sample": "If I {were} you, I {would apologise} to her.",
        "note": "Khuôn cố định. Dùng were cho mọi ngôi, kể cả I và he/she."
      },
      {
        "name": "Điều kiện phủ định với unless",
        "sample": "{Unless} you book a table now, there will be no seats left.",
        "note": "unless đã mang sẵn nghĩa “nếu không”, nên vế sau nó luôn ở dạng khẳng định."
      },
      {
        "name": "Mong ước trái thực tế",
        "sample": "I wish I {had} more time to read every day.",
        "note": "wish và if only mượn đúng cơ chế lùi thì của câu điều kiện loại 2 và loại 3."
      }
    ],
    "traps": [
      {
        "wrong": "If it will rain tomorrow, we will cancel the trip.",
        "right": "If it rains tomorrow, we will cancel the trip.",
        "why": "Tiếng Việt nói “nếu ngày mai trời sẽ mưa” vẫn xuôi tai, nhưng tiếng Anh không đặt will sau if — ý tương lai đã nằm ở vế chính rồi."
      },
      {
        "wrong": "If I would have money, I would buy a house.",
        "right": "If I had money, I would buy a house.",
        "why": "would chỉ đứng ở vế chính. Vế if của loại 2 dùng quá khứ đơn."
      },
      {
        "wrong": "If she had studied, she would passed the exam.",
        "right": "If she had studied, she would have passed the exam.",
        "why": "Vế chính loại 3 cần đủ ba phần would + have + V3, thiếu have là mất dấu hiệu “đã không xảy ra”."
      },
      {
        "wrong": "If I was you, I would take that job.",
        "right": "If I were you, I would take that job.",
        "why": "Trong câu giả định, were dùng cho mọi ngôi. Đây là khuôn cố định của lời khuyên."
      },
      {
        "wrong": "Unless you don't hurry, you will miss the bus.",
        "right": "Unless you hurry, you will miss the bus.",
        "why": "unless = if not. Thêm một lần phủ định nữa là câu quay ngược nghĩa."
      },
      {
        "wrong": "I wish I have more free time.",
        "right": "I wish I had more free time.",
        "why": "Sau wish phải lùi một thì. Người Việt nói “ước gì tôi có” ở thì hiện tại nên hay bê nguyên sang."
      }
    ],
    "compare": {
      "with": "Điều kiện có thật — loại 0 & 1",
      "rows": [
        {
          "key": "Quan hệ với thực tế",
          "other": "Có thể xảy ra, hoặc luôn đúng",
          "self": "Trái với thực tế — chỉ là giả định"
        },
        {
          "key": "Thì ở vế if",
          "other": "Hiện tại đơn",
          "self": "Quá khứ đơn cho hiện tại, quá khứ hoàn thành cho quá khứ"
        },
        {
          "key": "Vế chính",
          "other": "V hiện tại, hoặc will / can / may + V",
          "self": "would / could / might + V, thêm have + V3 nếu nói về quá khứ"
        },
        {
          "key": "Ví dụ đối chiếu",
          "other": "If I have time, I will call you.",
          "self": "If I had time, I would call you."
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Dịch thẳng “nếu… thì…” nên mặc định rơi vào loại 1",
          "self": "Quên bước lùi thì, hoặc đặt would vào vế if"
        }
      ]
    },
    "items": [
      {
        "id": "conditionals-1",
        "kind": "cloze",
        "prompt": "If you heat water to 100 degrees, it ___. ",
        "answers": [
          "boils"
        ],
        "cue": "boil",
        "explain": "Loại 0 — quy luật luôn đúng, cả hai vế đều hiện tại đơn.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-2",
        "kind": "mcq",
        "prompt": "If it ___ tomorrow, we will cancel the picnic.",
        "answers": [
          "rains"
        ],
        "options": [
          "rains",
          "will rain",
          "rained",
          "would rain"
        ],
        "explain": "Vế if của loại 1 dùng hiện tại đơn, không dùng will dù nghĩa là tương lai.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-3",
        "kind": "cloze",
        "prompt": "If the bus ___ late, call me straight away.",
        "answers": [
          "comes"
        ],
        "explain": "Sau if không bao giờ có will, kể cả khi vế chính là câu mệnh lệnh.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-4",
        "kind": "mcq",
        "prompt": "Unless you ___ a table now, there will be no seats left.",
        "answers": [
          "book"
        ],
        "options": [
          "book",
          "don't book",
          "will book",
          "booked"
        ],
        "explain": "unless đã mang nghĩa phủ định nên vế sau nó ở dạng khẳng định.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-5",
        "kind": "cloze",
        "prompt": "If I ___ more free time, I would learn the guitar. ",
        "answers": [
          "had"
        ],
        "cue": "have",
        "explain": "Loại 2 — vế if dùng quá khứ đơn dù đang nói về hiện tại.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-6",
        "kind": "mcq",
        "prompt": "If I were you, I ___ to her.",
        "answers": [
          "would apologise"
        ],
        "options": [
          "would apologise",
          "will apologise",
          "would apologised",
          "apologise"
        ],
        "explain": "Vế chính loại 2 là would + V nguyên thể, không chia thêm đuôi.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-7",
        "kind": "correct",
        "prompt": "If I was the manager, I would change the schedule.",
        "answers": [
          "were"
        ],
        "tokens": [
          "If",
          "I",
          "was",
          "the",
          "manager,",
          "I",
          "would",
          "change",
          "the",
          "schedule."
        ],
        "errIndex": 2,
        "explain": "Trong câu giả định, were dùng cho mọi ngôi, kể cả I.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-8",
        "kind": "cloze",
        "prompt": "She ___ more if she did not have a small child. ",
        "answers": [
          "would travel"
        ],
        "cue": "travel",
        "explain": "Sự thật là cô ấy đang có con nhỏ, nên đây là giả định trái với hiện tại.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-9",
        "kind": "cloze",
        "prompt": "If he ___ the answer, he would tell us.",
        "answers": [
          "knew"
        ],
        "explain": "would chỉ đứng ở vế chính. Vế if lùi về quá khứ đơn.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-10",
        "kind": "mcq",
        "prompt": "If we ___ closer to the sea, we could swim every day.",
        "answers": [
          "lived"
        ],
        "options": [
          "lived",
          "live",
          "had lived",
          "would live"
        ],
        "explain": "Vế chính có could + V nên vế if phải là quá khứ đơn.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-11",
        "kind": "cloze",
        "prompt": "If she ___ harder, she would have passed the exam. ",
        "answers": [
          "had studied"
        ],
        "cue": "study",
        "explain": "Loại 3 — vế if lùi về quá khứ hoàn thành.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-12",
        "kind": "cloze",
        "prompt": "We ___ the train if we had left ten minutes earlier. ",
        "answers": [
          "would have caught"
        ],
        "cue": "catch",
        "explain": "Vế chính loại 3 gồm đủ would + have + V3.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-13",
        "kind": "cloze",
        "prompt": "If they had told me earlier, I ___ to the wedding.",
        "answers": [
          "would have come"
        ],
        "explain": "Sau would không dùng V2. Việc đã không xảy ra nên cần would have + V3.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-14",
        "kind": "mcq",
        "prompt": "If I ___ about the meeting, I would have joined you.",
        "answers": [
          "had known"
        ],
        "options": [
          "had known",
          "knew",
          "would know",
          "have known"
        ],
        "explain": "Thấy would have ở vế chính thì vế if chắc chắn là quá khứ hoàn thành.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-15",
        "kind": "cloze",
        "prompt": "If the driver had been more careful, the accident ___.",
        "answers": [
          "would not have happened"
        ],
        "explain": "Tai nạn đã xảy ra rồi, nên vế chính phải ở dạng quá khứ giả định.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-16",
        "kind": "cloze",
        "prompt": "He would not have missed the flight if he ___ an alarm. ",
        "answers": [
          "had set"
        ],
        "cue": "set",
        "explain": "Điều kiện nằm trước một mốc quá khứ nên dùng had + V3.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-17",
        "kind": "cloze",
        "prompt": "If I had saved more money last year, I ___ on holiday now. ",
        "answers": [
          "would be"
        ],
        "cue": "be",
        "explain": "Hỗn hợp — điều kiện ở quá khứ, kết quả ở hiện tại nên vế chính chỉ có would + V.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-18",
        "kind": "mcq",
        "prompt": "If she ___ the job in Ha Noi, she would be living there now.",
        "answers": [
          "had taken"
        ],
        "options": [
          "had taken",
          "took",
          "takes",
          "would take"
        ],
        "explain": "Việc nhận việc thuộc quá khứ, còn “sống ở đó” là hiện tại.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-19",
        "kind": "cloze",
        "prompt": "If he were more organised, he ___ his passport. ",
        "answers": [
          "would not have lost"
        ],
        "cue": "not lose",
        "explain": "Hỗn hợp ngược — tính cách ở hiện tại giải thích một việc đã xảy ra.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-20",
        "kind": "cloze",
        "prompt": "I wish I ___ more time to read every day. ",
        "answers": [
          "had"
        ],
        "cue": "have",
        "explain": "Sau wish lùi một thì để đánh dấu điều trái với hiện tại.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-21",
        "kind": "cloze",
        "prompt": "I wish I ___ to your advice last week.",
        "answers": [
          "had listened"
        ],
        "explain": "Tiếc nuối một việc đã qua thì dùng wish + quá khứ hoàn thành.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-22",
        "kind": "mcq",
        "prompt": "If only we ___ the tickets earlier, we would be sitting together now.",
        "answers": [
          "had booked"
        ],
        "options": [
          "had booked",
          "booked",
          "book",
          "have booked"
        ],
        "explain": "If only hoạt động y như wish — việc đã qua thì lùi về quá khứ hoàn thành.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-23",
        "kind": "cloze",
        "prompt": "___ I known about the traffic, I would have taken the train.",
        "answers": [
          "Had"
        ],
        "explain": "Đảo ngữ của loại 3 — bỏ if, đưa had lên đầu câu.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-24",
        "kind": "mcq",
        "prompt": "___ I in your position, I would accept the offer.",
        "answers": [
          "Were"
        ],
        "options": [
          "Were",
          "Was",
          "If were",
          "Had"
        ],
        "explain": "Đảo ngữ của If I were — Were đứng đầu, không kèm if.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-25",
        "kind": "cloze",
        "prompt": "Unless you ___ now, you will miss the last bus.",
        "answers": [
          "leave"
        ],
        "explain": "unless đã là “nếu không”, thêm not nữa là câu ngược nghĩa.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-26",
        "kind": "transform",
        "prompt": "I do not have a car, so I cannot drive you to the airport.",
        "answers": [
          "If I had a car, I could drive you to the airport."
        ],
        "explain": "Đổi một sự thật hiện tại thành giả định loại 2 — lùi một thì ở cả hai vế.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-27",
        "kind": "transform",
        "prompt": "She did not read the instructions, so she made a mistake.",
        "answers": [
          "If she had read the instructions, she would not have made a mistake."
        ],
        "explain": "Việc đã qua nên chuyển sang loại 3, và đảo dấu phủ định ở cả hai vế.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-28",
        "kind": "transform",
        "prompt": "If you do not water the plants, they will die.",
        "answers": [
          "Unless you water the plants, they will die."
        ],
        "explain": "unless thay cho if not, bỏ luôn phủ định phía sau.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-29",
        "kind": "transform",
        "prompt": "If I had left earlier, I would not be stuck in traffic now.",
        "answers": [
          "Had I left earlier, I would not be stuck in traffic now."
        ],
        "explain": "Đảo ngữ — bỏ if, đưa had lên trước chủ ngữ.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "conditionals-30",
        "kind": "transform",
        "prompt": "I am sorry I cannot speak Japanese.",
        "answers": [
          "I wish I could speak Japanese."
        ],
        "explain": "Chuyển lời tiếc nuối về hiện tại sang cấu trúc wish + could.",
        "errorTag": "Nhầm thì"
      }
    ]
  },
  {
    "key": "gerund-infinitive",
    "builtin": true,
    "name": "Gerund & Infinitive",
    "nameEn": "Gerund and infinitive",
    "level": "B2",
    "group": "Động từ & cấu trúc",
    "description": "Chọn V-ing hay to V cho động từ thứ hai trong câu. Tiếng Việt nối hai động từ liền nhau mà không đổi dạng từ nào, nên người học chọn bừa và viết enjoy to watch hoặc decide going.",
    "icon": "pen",
    "tags": [
      "Giới từ"
    ],
    "signals": [
      "enjoy",
      "avoid",
      "suggest",
      "mind",
      "decide",
      "promise",
      "refuse",
      "manage",
      "remember",
      "stop"
    ],
    "formulas": [
      {
        "form": "Động từ theo sau là V-ing",
        "structure": "S + V + V-ing",
        "example": "She enjoys cooking for her family."
      },
      {
        "form": "Động từ theo sau là to V",
        "structure": "S + V + to V",
        "example": "They decided to move to Da Nang."
      },
      {
        "form": "Sau giới từ luôn là V-ing",
        "structure": "… + giới từ + V-ing",
        "example": "He left the room without saying goodbye."
      },
      {
        "form": "Động từ + tân ngữ + to V",
        "structure": "S + V + O + to V",
        "example": "My parents want me to study medicine."
      },
      {
        "form": "make, let, have + tân ngữ + V nguyên thể",
        "structure": "S + make / let / have + O + V",
        "example": "My boss made me rewrite the whole report."
      },
      {
        "form": "V-ing làm chủ ngữ",
        "structure": "V-ing + V + …",
        "example": "Learning a language takes years of practice."
      },
      {
        "form": "Nhóm đổi nghĩa theo dạng đi sau",
        "structure": "S + stop / remember / forget / try + V-ing hoặc to V",
        "example": "He stopped smoking. Nhưng: He stopped to smoke."
      }
    ],
    "uses": [
      {
        "name": "Nhóm động từ chỉ nhận V-ing",
        "sample": "She really enjoys {cooking} for her family.",
        "note": "enjoy, avoid, finish, mind, practise, deny, admit, keep, imagine đều thuộc nhóm này. Học theo danh sách chứ không suy luận được."
      },
      {
        "name": "Đề nghị, cân nhắc, né tránh",
        "sample": "He avoided {answering} my question about the money.",
        "note": "avoid, suggest, consider luôn kéo theo V-ing. Đây là ba động từ người Việt hay ghép nhầm với to V nhất."
      },
      {
        "name": "Nhóm động từ chỉ nhận to V",
        "sample": "They decided {to move} to Da Nang last spring.",
        "note": "decide, hope, promise, agree, refuse, manage, offer, afford, expect, learn hướng tới một việc chưa xảy ra."
      },
      {
        "name": "Hứa hẹn và từ chối",
        "sample": "She refused {to lend} him any more money.",
        "note": "refuse và promise nói về một quyết định cho tương lai, nên động từ theo sau ở dạng nguyên thể có to."
      },
      {
        "name": "Sau giới từ luôn là V-ing",
        "sample": "He left the room without {saying} goodbye.",
        "note": "in, at, on, for, about, without đều là giới từ, và không có giới từ nào đứng trước to V được."
      },
      {
        "name": "Động từ + tân ngữ + to V",
        "sample": "My parents want me {to study} medicine.",
        "note": "want, ask, tell, allow, advise chèn người thực hiện vào giữa. Tiếng Anh không dùng mệnh đề that ở đây."
      },
      {
        "name": "make, let, have + V nguyên thể",
        "sample": "My boss made me {rewrite} the whole report.",
        "note": "Ba động từ này bỏ hẳn to. Riêng dạng bị động thì to quay lại: I was made to rewrite it."
      },
      {
        "name": "V-ing làm chủ ngữ",
        "sample": "{Learning} a language takes years of practice.",
        "note": "Động từ đứng đầu câu làm chủ ngữ phải chuyển sang V-ing, không để nguyên thể trần."
      },
      {
        "name": "Nhóm đổi nghĩa",
        "sample": "I stopped {drinking} coffee last year; now I stop {to buy} tea on the way to work instead.",
        "note": "stop + V-ing là bỏ hẳn việc đó, còn stop + to V là dừng lại để làm việc khác. Chọn sai dạng là đổi nghĩa."
      }
    ],
    "traps": [
      {
        "wrong": "I enjoy to watch films at the weekend.",
        "right": "I enjoy watching films at the weekend.",
        "why": "Tiếng Việt nói “thích xem phim” nối hai động từ liền nhau. Người học thấy cần một từ nối nên mượn to, nhưng enjoy chỉ nhận V-ing."
      },
      {
        "wrong": "She suggested to go to the beach.",
        "right": "She suggested going to the beach.",
        "why": "Nghĩa “đề nghị đi biển” khiến to nghe rất hợp lý, nhưng suggest nằm trong nhóm chỉ nhận V-ing."
      },
      {
        "wrong": "He decided going to Da Nang alone.",
        "right": "He decided to go to Da Nang alone.",
        "why": "Lỗi ngược lại: người học nhớ mang máng rằng động từ thứ hai phải thêm -ing. decide nói về dự định nên cần to V."
      },
      {
        "wrong": "I am thinking about to buy a new laptop.",
        "right": "I am thinking about buying a new laptop.",
        "why": "about là giới từ, và không giới từ nào đứng trước to V được. Tiếng Việt nói “nghĩ về việc mua” nên chỗ này rất dễ trượt."
      },
      {
        "wrong": "My parents want that I study medicine.",
        "right": "My parents want me to study medicine.",
        "why": "Tiếng Việt nói “muốn tôi học y” bằng một mệnh đề. Tiếng Anh chèn thẳng người thực hiện vào giữa rồi mới tới to V."
      },
      {
        "wrong": "My boss made me to rewrite the report.",
        "right": "My boss made me rewrite the report.",
        "why": "Người học đã quen công thức V + O + to V nên áp luôn cho make. Riêng make, let, have thì bỏ hẳn to."
      },
      {
        "wrong": "Learn a language takes many years.",
        "right": "Learning a language takes many years.",
        "why": "Tiếng Việt để nguyên “học một ngôn ngữ” ở đầu câu. Tiếng Anh bắt động từ làm chủ ngữ phải chuyển sang V-ing."
      }
    ],
    "compare": {
      "with": "Động từ nguyên thể",
      "rows": [
        {
          "key": "Hình thức",
          "other": "to + V nguyên thể",
          "self": "V + đuôi -ing"
        },
        {
          "key": "Đứng sau động từ nào",
          "other": "decide, hope, promise, agree, refuse, manage, offer, expect",
          "self": "enjoy, avoid, finish, mind, suggest, consider, practise, deny"
        },
        {
          "key": "Sau giới từ",
          "other": "Không bao giờ đứng sau giới từ",
          "self": "Là dạng duy nhất dùng được sau in, at, on, for, about, without"
        },
        {
          "key": "Làm chủ ngữ",
          "other": "Dùng được nhưng nghe trang trọng, ít gặp",
          "self": "Cách nói tự nhiên nhất trong tiếng Anh hằng ngày"
        },
        {
          "key": "Sắc thái",
          "other": "Hướng tới việc chưa xảy ra, một dự định hoặc mục đích",
          "self": "Nói về việc chung chung, hoặc việc đang và đã diễn ra"
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Thêm to vào sau enjoy, avoid, suggest",
          "self": "Thêm đuôi -ing vào sau want, decide, hope"
        }
      ]
    },
    "items": [
      {
        "id": "gerund-infinitive-1",
        "kind": "cloze",
        "prompt": "She really enjoys ___ for her family. ",
        "answers": [
          "cooking"
        ],
        "cue": "cook",
        "explain": "enjoy nằm trong nhóm chỉ nhận danh động từ, không bao giờ đi với to.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-2",
        "kind": "mcq",
        "prompt": "I enjoy ___ films at the weekend.",
        "answers": [
          "watching"
        ],
        "options": [
          "watching",
          "to watch",
          "watch",
          "to watching"
        ],
        "explain": "Nghĩa “thích xem phim” khiến to nghe hợp lý, nhưng động từ này không nhận dạng nguyên thể.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-3",
        "kind": "cloze",
        "prompt": "My sister enjoys ___ in the early morning.",
        "answers": [
          "swimming"
        ],
        "explain": "Người học mượn to để nối hai động từ, trong khi tiếng Anh nối bằng đuôi -ing ở đây.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-4",
        "kind": "cloze",
        "prompt": "He avoided ___ my question about the money. ",
        "answers": [
          "answering"
        ],
        "cue": "answer",
        "explain": "avoid thuộc cùng nhóm với enjoy và finish, luôn kéo theo danh động từ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-5",
        "kind": "cloze",
        "prompt": "Would you mind ___ the window? ",
        "answers": [
          "opening"
        ],
        "cue": "open",
        "explain": "mind là lời đề nghị lịch sự nhưng vẫn thuộc nhóm chỉ nhận danh động từ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-6",
        "kind": "mcq",
        "prompt": "She suggested ___ to the beach on Sunday.",
        "answers": [
          "going"
        ],
        "options": [
          "going",
          "to go",
          "go",
          "to going"
        ],
        "explain": "Đây là động từ bị ghép nhầm với to nhiều nhất, vì nghĩa của nó hướng tới tương lai.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-7",
        "kind": "cloze",
        "prompt": "The manager suggested ___ the whole schedule.",
        "answers": [
          "changing"
        ],
        "explain": "Ý nghĩa đề nghị làm người học tưởng cần to, nhưng dạng đi sau đã cố định.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-8",
        "kind": "cloze",
        "prompt": "They decided ___ to Da Nang last spring. ",
        "answers": [
          "to move"
        ],
        "cue": "move",
        "explain": "decide nói về một dự định chưa thực hiện nên động từ theo sau ở dạng nguyên thể có to.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-9",
        "kind": "cloze",
        "prompt": "She refused ___ him any more money. ",
        "answers": [
          "to lend"
        ],
        "cue": "lend",
        "explain": "refuse là quyết định về việc sắp tới, cùng nhóm với promise và agree.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-10",
        "kind": "mcq",
        "prompt": "They hope ___ the project by June.",
        "answers": [
          "to finish"
        ],
        "options": [
          "to finish",
          "finishing",
          "finish",
          "to finishing"
        ],
        "explain": "hope hướng về một việc chưa xảy ra nên chỉ nhận dạng nguyên thể có to.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-11",
        "kind": "correct",
        "prompt": "He decided going to Da Nang alone.",
        "answers": [
          "to go"
        ],
        "tokens": [
          "He",
          "decided",
          "going",
          "to",
          "Da",
          "Nang",
          "alone."
        ],
        "errIndex": 2,
        "explain": "Người học nhớ mang máng rằng động từ thứ hai phải thêm -ing nên áp nhầm cho cả nhóm này.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-12",
        "kind": "correct",
        "prompt": "They promised helping us with the moving.",
        "answers": [
          "to help"
        ],
        "tokens": [
          "They",
          "promised",
          "helping",
          "us",
          "with",
          "the",
          "moving."
        ],
        "errIndex": 2,
        "explain": "Lời hứa luôn nói về việc chưa làm, nên dạng đi sau là nguyên thể có to.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-13",
        "kind": "cloze",
        "prompt": "He left the room without ___ goodbye. ",
        "answers": [
          "saying"
        ],
        "cue": "say",
        "explain": "without là giới từ, và không giới từ nào đứng trước dạng nguyên thể có to được.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-14",
        "kind": "mcq",
        "prompt": "He is good at ___ people.",
        "answers": [
          "persuading"
        ],
        "options": [
          "persuading",
          "persuade",
          "to persuade",
          "persuaded"
        ],
        "explain": "at là giới từ nên động từ phía sau bắt buộc chuyển sang danh động từ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-15",
        "kind": "cloze",
        "prompt": "I am thinking about ___ a new laptop.",
        "answers": [
          "buying"
        ],
        "explain": "Tiếng Việt nói “nghĩ về việc mua” nghe như một danh từ, nhưng sau about phải là V-ing.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-16",
        "kind": "cloze",
        "prompt": "My parents want me ___ medicine. ",
        "answers": [
          "to study"
        ],
        "cue": "study",
        "explain": "Người thực hiện được chèn thẳng vào giữa, tiếng Anh không dùng mệnh đề that sau want.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-17",
        "kind": "mcq",
        "prompt": "We asked the neighbours ___ the music down.",
        "answers": [
          "to turn"
        ],
        "options": [
          "to turn",
          "turn",
          "turning",
          "to turning"
        ],
        "explain": "ask theo công thức động từ cộng tân ngữ rồi mới tới dạng nguyên thể có to.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-18",
        "kind": "cloze",
        "prompt": "My boss made me ___ the whole report. ",
        "answers": [
          "rewrite"
        ],
        "cue": "rewrite",
        "explain": "make bỏ hẳn to, khác với ask và want dù nhìn ngoài ba câu có cùng cấu trúc.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-19",
        "kind": "mcq",
        "prompt": "My teacher let us ___ ten minutes early.",
        "answers": [
          "leave"
        ],
        "options": [
          "leave",
          "to leave",
          "leaving",
          "left"
        ],
        "explain": "let cùng nhóm với make và have, sau tân ngữ là động từ trần không có to.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-20",
        "kind": "cloze",
        "prompt": "My mother never lets me ___ out after ten.",
        "answers": [
          "stay"
        ],
        "explain": "Người học áp công thức của allow sang let, nhưng let không nhận to.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-21",
        "kind": "cloze",
        "prompt": "___ a language takes years of practice. ",
        "answers": [
          "Learning"
        ],
        "cue": "learn",
        "explain": "Động từ đứng đầu câu làm chủ ngữ phải chuyển sang danh động từ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-22",
        "kind": "correct",
        "prompt": "Get up early is still hard for me.",
        "answers": [
          "Getting"
        ],
        "tokens": [
          "Get",
          "up",
          "early",
          "is",
          "still",
          "hard",
          "for",
          "me."
        ],
        "errIndex": 0,
        "explain": "Tiếng Việt để nguyên “dậy sớm” ở đầu câu, còn tiếng Anh cần dạng danh động từ để làm chủ ngữ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-23",
        "kind": "cloze",
        "prompt": "I must remember ___ the door before I go out. ",
        "answers": [
          "to lock"
        ],
        "cue": "lock",
        "explain": "Việc khoá cửa chưa làm, remember đang nhắc tới một nhiệm vụ sắp tới.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-24",
        "kind": "mcq",
        "prompt": "She does not remember ___ him at the conference last year.",
        "answers": [
          "meeting"
        ],
        "options": [
          "meeting",
          "to meet",
          "meet",
          "met"
        ],
        "explain": "Cuộc gặp đã xảy ra rồi, và ký ức về việc đã qua thì dùng danh động từ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-25",
        "kind": "mcq",
        "prompt": "I stopped ___ some water on the way home.",
        "answers": [
          "to buy"
        ],
        "options": [
          "to buy",
          "buying",
          "buy",
          "for buying"
        ],
        "explain": "Ở đây việc dừng lại là để làm một việc khác, nên cần dạng chỉ mục đích.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-26",
        "kind": "cloze",
        "prompt": "I stopped ___ coffee because I could not sleep. ",
        "answers": [
          "drinking"
        ],
        "cue": "drink",
        "explain": "Đây là bỏ hẳn một thói quen chứ không phải dừng lại để làm việc gì.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-27",
        "kind": "transform",
        "prompt": "He told us he would not sign the contract.",
        "answers": [
          "He refused to sign the contract."
        ],
        "explain": "refuse thay cho cả cụm would not, và động từ theo sau ở dạng nguyên thể có to.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-28",
        "kind": "transform",
        "prompt": "Let us take a taxi, she said.",
        "answers": [
          "She suggested taking a taxi."
        ],
        "explain": "suggest không nhận to dù nội dung là một lời rủ rê hướng tới việc sắp làm.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-29",
        "kind": "transform",
        "prompt": "It is not safe to drive when you are very tired.",
        "answers": [
          "Driving when you are very tired is not safe."
        ],
        "explain": "Khi đưa hành động lên làm chủ ngữ thật thì nó chuyển sang dạng danh động từ.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-30",
        "kind": "transform",
        "prompt": "My parents did not allow me to stay out late.",
        "answers": [
          "My parents did not let me stay out late."
        ],
        "explain": "allow giữ to, còn let thì bỏ, nên đổi động từ là phải đổi luôn dạng phía sau.",
        "errorTag": "Giới từ"
      },
      {
        "id": "gerund-infinitive-31",
        "kind": "transform",
        "prompt": "He used to smoke, but he does not smoke any more.",
        "answers": [
          "He stopped smoking."
        ],
        "explain": "Bỏ hẳn một thói quen thì dùng danh động từ, dạng có to sẽ thành nghĩa dừng lại để hút.",
        "errorTag": "Giới từ"
      }
    ]
  },
  {
    "key": "reported-speech",
    "builtin": true,
    "name": "Câu tường thuật",
    "nameEn": "Reported speech",
    "level": "B2",
    "group": "Câu phức",
    "description": "Kể lại lời của người khác bằng lời của mình. Tiếng Việt thuật lại gần như nguyên văn — không lùi thì, không đổi trật tự câu hỏi — nên người học hay bê thẳng câu gốc sang tiếng Anh và giữ nguyên “anh ấy nói anh ấy đang bận”.",
    "icon": "speak",
    "tags": [
      "Nhầm thì"
    ],
    "signals": [
      "said",
      "told",
      "asked",
      "whether",
      "if",
      "that day",
      "the next day",
      "the day before",
      "there",
      "advised"
    ],
    "formulas": [
      {
        "form": "Thuật lại câu kể",
        "structure": "S + said (that) + S + V lùi một thì",
        "example": "He said that he was very tired."
      },
      {
        "form": "Thuật lại có người nghe",
        "structure": "S + told + O + (that) + S + V lùi một thì",
        "example": "She told me she had lost her wallet."
      },
      {
        "form": "Câu hỏi Yes-No",
        "structure": "S + asked (+ O) + if / whether + S + V",
        "example": "He asked me if I wanted another coffee."
      },
      {
        "form": "Câu hỏi Wh-",
        "structure": "S + asked (+ O) + wh- + S + V",
        "example": "She asked me where I worked."
      },
      {
        "form": "Mệnh lệnh, lời nhờ",
        "structure": "S + told / asked + O + (not) to + V",
        "example": "The teacher told us not to talk during the test."
      },
      {
        "form": "Động từ tường thuật khác",
        "structure": "suggest + V-ing · offer / promise + to V · advise, remind, warn + O + to V",
        "example": "He suggested taking a taxi."
      }
    ],
    "uses": [
      {
        "name": "Thuật lại một câu kể ở hiện tại",
        "sample": "He said that he {was} very tired after the trip.",
        "note": "Động từ tường thuật said ở quá khứ nên lời nói bên trong lùi một thì: hiện tại đơn thành quá khứ đơn."
      },
      {
        "name": "Thuật lại việc xảy ra trước lúc nói",
        "sample": "She told me she {had lost} her wallet on the bus.",
        "note": "Quá khứ đơn và hiện tại hoàn thành trong lời gốc đều lùi về quá khứ hoàn thành."
      },
      {
        "name": "Đổi trạng từ chỉ thời gian",
        "sample": "He said he would send the file {the next day}.",
        "note": "Lời gốc là tomorrow, nhưng người thuật kể ở một ngày khác nên mốc thời gian phải dời theo."
      },
      {
        "name": "Đổi trạng từ nơi chốn và từ chỉ định",
        "sample": "The guide said we could not take photos {there}, in {that} room.",
        "note": "here và this gắn với chỗ người nói đang đứng, nên khi kể lại phải đổi thành there và that."
      },
      {
        "name": "Thuật lại câu hỏi Yes-No",
        "sample": "He asked me {whether} I had finished the report.",
        "note": "Câu hỏi không có từ để hỏi thì cần if hoặc whether nối vào, và bỏ hẳn dấu chấm hỏi."
      },
      {
        "name": "Thuật lại câu hỏi Wh-",
        "sample": "She asked me where {I lived} at that time.",
        "note": "Trong câu tường thuật, câu hỏi trở về trật tự S-V và bỏ trợ động từ do, does, did."
      },
      {
        "name": "Chọn tell hay say",
        "sample": "She {told} me the meeting had been cancelled.",
        "note": "tell đi thẳng với người nghe; nếu muốn dùng say thì phải thêm to: she said to me."
      },
      {
        "name": "Lời khuyên, lời nhờ, lời cảnh báo",
        "sample": "The doctor advised me {to drink} more water every day.",
        "note": "Nhóm advise, ask, remind, warn đều theo khuôn V + O + to V, không dùng that trong văn nói thường ngày."
      },
      {
        "name": "Nội dung vẫn còn đúng nên không lùi thì",
        "sample": "Our teacher said that water {boils} at one hundred degrees.",
        "note": "Sự thật hiển nhiên hoặc việc đến giờ vẫn đúng thì giữ nguyên thì cũng được, lùi thì không sai nhưng không cần."
      }
    ],
    "traps": [
      {
        "wrong": "He said he is very tired.",
        "right": "He said he was very tired.",
        "why": "Tiếng Việt nói “anh ấy nói anh ấy rất mệt” không đổi gì cả, nhưng tiếng Anh phải lùi một thì cho khớp với said ở quá khứ."
      },
      {
        "wrong": "She said me that she was busy.",
        "right": "She told me that she was busy.",
        "why": "say không đi thẳng với người nghe. Muốn nêu người nghe thì dùng told me, hoặc said to me."
      },
      {
        "wrong": "He asked me where did I live.",
        "right": "He asked me where I lived.",
        "why": "Khi đã tường thuật thì câu hỏi không còn là câu hỏi nữa, nên trả về trật tự S-V và bỏ did."
      },
      {
        "wrong": "She asked me if I have finished the report.",
        "right": "She asked me if I had finished the report.",
        "why": "asked ở quá khứ nên phần sau if cũng phải lùi thì, hiện tại hoàn thành thành quá khứ hoàn thành."
      },
      {
        "wrong": "He said he will call me tomorrow.",
        "right": "He said he would call me the next day.",
        "why": "will lùi thành would, và tomorrow tính theo ngày người ta nói chứ không phải ngày kể lại."
      },
      {
        "wrong": "My mother told me don't open the door.",
        "right": "My mother told me not to open the door.",
        "why": "Người Việt kể lại mệnh lệnh vẫn giữ nguyên chữ “đừng”. Tiếng Anh chuyển sang not to V, phủ định đứng trước to."
      },
      {
        "wrong": "She suggested to go to the beach.",
        "right": "She suggested going to the beach.",
        "why": "suggest không đi với to V. Đây là động từ bắt buộc theo sau bằng V-ing."
      }
    ],
    "compare": {
      "with": "Câu trực tiếp",
      "rows": [
        {
          "key": "Cách ghi lời nói",
          "other": "Chép nguyên văn, đặt trong dấu ngoặc kép",
          "self": "Kể lại bằng lời người thuật, bỏ ngoặc kép"
        },
        {
          "key": "Thì của động từ",
          "other": "Giữ đúng thì lúc người ta nói ra",
          "self": "Lùi một thì khi động từ tường thuật ở quá khứ"
        },
        {
          "key": "Đại từ và từ sở hữu",
          "other": "Theo người đang nói: I, my, we",
          "self": "Đổi theo người được kể: he, his, they"
        },
        {
          "key": "Trạng từ thời gian, nơi chốn",
          "other": "now, today, tomorrow, here, this",
          "self": "then, that day, the next day, there, that"
        },
        {
          "key": "Trật tự trong câu hỏi",
          "other": "Đảo trợ động từ lên trước chủ ngữ: Where do you live?",
          "self": "Giữ trật tự S-V và bỏ do, does, did: where I lived"
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Quen thuật nguyên văn nên bê thẳng câu gốc sang",
          "self": "Quên lùi thì, và giữ nguyên trật tự đảo của câu hỏi"
        }
      ]
    },
    "items": [
      {
        "id": "reported-speech-1",
        "kind": "cloze",
        "prompt": "He said that he ___ very tired after the trip. ",
        "answers": [
          "was"
        ],
        "cue": "be",
        "explain": "said ở quá khứ nên lời nói bên trong phải lùi một thì theo.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-2",
        "kind": "mcq",
        "prompt": "She said she ___ the new office.",
        "answers": [
          "liked"
        ],
        "options": [
          "liked",
          "likes",
          "will like",
          "has liked"
        ],
        "explain": "Lời gốc ở hiện tại đơn, lùi một thì thành quá khứ đơn.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-3",
        "kind": "cloze",
        "prompt": "Tom said he ___ for a new flat.",
        "answers": [
          "was looking"
        ],
        "explain": "Hiện tại tiếp diễn trong lời gốc lùi thành quá khứ tiếp diễn.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-4",
        "kind": "mcq",
        "prompt": "He said he ___ me the next morning.",
        "answers": [
          "would call"
        ],
        "options": [
          "would call",
          "will call",
          "calls",
          "is calling"
        ],
        "explain": "will không đứng được sau một động từ tường thuật ở quá khứ, nó lùi thành would.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-5",
        "kind": "cloze",
        "prompt": "They said they ___ a house the year before. ",
        "answers": [
          "had bought"
        ],
        "cue": "buy",
        "explain": "Việc mua nhà xảy ra trước lúc họ nói, nên phải lùi thêm một bậc nữa.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-6",
        "kind": "cloze",
        "prompt": "She said she ___ her report.",
        "answers": [
          "had finished"
        ],
        "explain": "Hiện tại hoàn thành lùi về quá khứ hoàn thành, không có dạng nào lùi sâu hơn nữa.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-7",
        "kind": "cloze",
        "prompt": "She said she was leaving for Hue ___. ",
        "answers": [
          "the next day"
        ],
        "cue": "tomorrow",
        "explain": "Người kể đang nói ở một thời điểm khác nên mốc “ngày mai” phải tính lại theo ngày cô ấy nói.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-8",
        "kind": "mcq",
        "prompt": "He said he had met her ___.",
        "answers": [
          "the day before"
        ],
        "options": [
          "the day before",
          "yesterday",
          "the next day",
          "today"
        ],
        "explain": "yesterday gắn với hôm người ta nói, khi thuật lại phải quy về mốc của lời nói đó.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-9",
        "kind": "correct",
        "prompt": "She told me she would wait for me here.",
        "answers": [
          "there"
        ],
        "tokens": [
          "She",
          "told",
          "me",
          "she",
          "would",
          "wait",
          "for",
          "me",
          "here."
        ],
        "errIndex": 8,
        "explain": "Người thuật không còn đứng ở chỗ cô ấy nhắc tới, nên here mất điểm quy chiếu.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-10",
        "kind": "cloze",
        "prompt": "The guide said we could not take photos in ___ room. ",
        "answers": [
          "that"
        ],
        "cue": "this",
        "explain": "this chỉ vào thứ ngay trước mặt người nói, kể lại thì phải chuyển thành that.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-11",
        "kind": "mcq",
        "prompt": "Lan said she was very tired ___.",
        "answers": [
          "then"
        ],
        "options": [
          "then",
          "now",
          "today",
          "here"
        ],
        "explain": "now là lúc Lan nói, không phải lúc ta kể, nên phải đổi sang mốc đã qua.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-12",
        "kind": "cloze",
        "prompt": "He ___ us that the shop closed at nine. ",
        "answers": [
          "told"
        ],
        "cue": "tell",
        "explain": "Có tân ngữ us đứng ngay sau thì bắt buộc dùng động từ này chứ không dùng say.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-13",
        "kind": "correct",
        "prompt": "She said me that the meeting had been postponed.",
        "answers": [
          "told"
        ],
        "tokens": [
          "She",
          "said",
          "me",
          "that",
          "the",
          "meeting",
          "had",
          "been",
          "postponed."
        ],
        "errIndex": 1,
        "explain": "say không nhận thẳng người nghe làm tân ngữ, muốn giữ say thì phải viết said to me.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-14",
        "kind": "mcq",
        "prompt": "Minh ___ me that he was moving abroad.",
        "answers": [
          "said to"
        ],
        "options": [
          "said to",
          "told to",
          "said",
          "says to"
        ],
        "explain": "Muốn dùng say mà vẫn nêu người nghe thì phải chèn giới từ to vào giữa.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-15",
        "kind": "cloze",
        "prompt": "He asked me ___ I wanted another cup of coffee.",
        "answers": [
          "if"
        ],
        "explain": "Câu hỏi gốc không có từ để hỏi nên cần một từ nối đứng ra thay chỗ đó.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-16",
        "kind": "cloze",
        "prompt": "She asked me where ___.",
        "answers": [
          "I lived"
        ],
        "explain": "Đã thuật lại thì phần sau where trở về trật tự S-V bình thường, did biến mất.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-17",
        "kind": "cloze",
        "prompt": "My teacher asked me why I ___ late. ",
        "answers": [
          "was"
        ],
        "cue": "be",
        "explain": "Sau why vẫn giữ trật tự chủ ngữ trước động từ, và động từ lùi một thì.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-18",
        "kind": "mcq",
        "prompt": "He asked me what time ___.",
        "answers": [
          "the film started"
        ],
        "options": [
          "the film started",
          "did the film start",
          "does the film start",
          "started the film"
        ],
        "explain": "Cụm what time chỉ là từ nối, phần sau nó viết như một mệnh đề kể chứ không đảo.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-19",
        "kind": "cloze",
        "prompt": "The doctor advised me ___ more water. ",
        "answers": [
          "to drink"
        ],
        "cue": "drink",
        "explain": "advise theo khuôn có người nhận lời khuyên rồi mới tới to V.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-20",
        "kind": "mcq",
        "prompt": "She suggested ___ to the beach at the weekend.",
        "answers": [
          "going"
        ],
        "options": [
          "going",
          "to go",
          "that go",
          "go"
        ],
        "explain": "suggest là động từ chỉ nhận V-ing phía sau, không nhận to V.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-21",
        "kind": "correct",
        "prompt": "He offered helping me with the luggage.",
        "answers": [
          "to help"
        ],
        "tokens": [
          "He",
          "offered",
          "helping",
          "me",
          "with",
          "the",
          "luggage."
        ],
        "errIndex": 2,
        "explain": "offer là lời hứa sẽ làm gì đó, nên theo sau là to V chứ không phải V-ing.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-22",
        "kind": "cloze",
        "prompt": "My mother reminded me ___ the door before leaving. ",
        "answers": [
          "to lock"
        ],
        "cue": "lock",
        "explain": "remind thuộc nhóm nhắc nhở ai làm gì, luôn có tân ngữ rồi mới tới to V.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-23",
        "kind": "cloze",
        "prompt": "My mother told me ___ alone at night.",
        "answers": [
          "not to go out"
        ],
        "explain": "Mệnh lệnh phủ định khi thuật lại chuyển thành not to V, chữ not đứng trước to.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-24",
        "kind": "cloze",
        "prompt": "Our teacher said that water ___ at one hundred degrees. ",
        "answers": [
          "boils"
        ],
        "cue": "boil",
        "explain": "Đây là sự thật đến giờ vẫn đúng nên không cần đẩy về quá khứ.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-25",
        "kind": "mcq",
        "prompt": "He says he ___ coming to the party tonight.",
        "answers": [
          "is"
        ],
        "options": [
          "is",
          "was",
          "were",
          "had been"
        ],
        "explain": "Động từ tường thuật đang ở hiện tại nên không có gì để lùi cả.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-26",
        "kind": "transform",
        "prompt": "“I am waiting for the bus,” she said.",
        "answers": [
          "She said that she was waiting for the bus."
        ],
        "explain": "Đổi đại từ I thành she và lùi hiện tại tiếp diễn thành quá khứ tiếp diễn.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-27",
        "kind": "transform",
        "prompt": "“I will send you the file tomorrow,” Nam said.",
        "answers": [
          "Nam said that he would send me the file the next day."
        ],
        "explain": "will lùi thành would, you thành me, và tomorrow dời theo mốc lúc Nam nói.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-28",
        "kind": "transform",
        "prompt": "“Where do you work?” she asked me.",
        "answers": [
          "She asked me where I worked."
        ],
        "explain": "Bỏ do, trả trật tự về S-V và lùi động từ một thì.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-29",
        "kind": "transform",
        "prompt": "“Have you seen my keys?” he asked her.",
        "answers": [
          "He asked her whether she had seen his keys."
        ],
        "explain": "Câu hỏi Yes-No cần từ nối whether, và my đổi theo người nói ban đầu.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "reported-speech-30",
        "kind": "transform",
        "prompt": "“Let's take a taxi,” he said.",
        "answers": [
          "He suggested taking a taxi."
        ],
        "explain": "Lời rủ rê hợp với suggest, và động từ này chỉ nhận V-ing.",
        "errorTag": "Nhầm thì"
      }
    ]
  },
  {
    "key": "modal-perfect",
    "builtin": true,
    "name": "Modal perfect — suy đoán & tiếc nuối",
    "nameEn": "Modal perfect",
    "level": "B2",
    "group": "Động từ & cấu trúc",
    "description": "Khuôn modal + have + V3 dùng để bàn về chuyện đã qua: đoán chuyện gì đã xảy ra, hoặc tiếc vì đã làm hay đã không làm. Tiếng Việt nói “chắc là đã…”, “đáng lẽ đã…” nên người học đặt chữ “đã” nhầm chỗ, viết thành must had hoặc should have went.",
    "icon": "bulb",
    "tags": [
      "Nhầm thì"
    ],
    "signals": [
      "must have",
      "can't have",
      "might have",
      "could have",
      "should have",
      "shouldn't have",
      "needn't have",
      "would have",
      "ought to have"
    ],
    "formulas": [
      {
        "form": "Suy đoán gần như chắc chắn",
        "structure": "S + must + have + V3",
        "example": "She must have forgotten our appointment."
      },
      {
        "form": "Bác bỏ một suy đoán",
        "structure": "S + can't / couldn't + have + V3",
        "example": "He can't have finished the whole book already."
      },
      {
        "form": "Khả năng còn để ngỏ",
        "structure": "S + may / might / could + have + V3",
        "example": "They might have taken the wrong bus."
      },
      {
        "form": "Đáng lẽ nên làm mà đã không làm",
        "structure": "S + should / ought to + have + V3",
        "example": "I should have booked the tickets earlier."
      },
      {
        "form": "Trách một việc đã trót làm",
        "structure": "S + shouldn't + have + V3",
        "example": "You shouldn't have told her about the surprise."
      },
      {
        "form": "Đã làm nhưng hoá ra không cần",
        "structure": "S + needn't + have + V3",
        "example": "We needn't have hurried; the train was late."
      },
      {
        "form": "Việc đã không xảy ra",
        "structure": "S + would + have + V3",
        "example": "I would have helped you, but I was out of town."
      }
    ],
    "uses": [
      {
        "name": "Suy đoán có bằng chứng rõ ràng",
        "sample": "The lights are off, so she {must have gone} to bed.",
        "note": "Nhìn thấy dấu vết rồi mới đoán ngược lại nguyên nhân. must có nghĩa “chắc chắn là”, không phải “phải”."
      },
      {
        "name": "Bác bỏ một suy đoán về quá khứ",
        "sample": "He {can't have seen} me; I was at home all evening.",
        "note": "Đây là mặt phủ định của must have: gần như chắc chắn việc đó đã không xảy ra. Không dùng mustn't have cho nghĩa này."
      },
      {
        "name": "Khả năng chưa rõ đúng sai",
        "sample": "They {might have missed} the last bus home.",
        "note": "may, might, could have đều để ngỏ, tương đương “có thể là đã…”. Ba từ này gần như thay được cho nhau."
      },
      {
        "name": "Tiếc vì đã không làm",
        "sample": "I {should have booked} the tickets a month earlier.",
        "note": "Việc đó đã không xảy ra và giờ không sửa được nữa, nên câu mang sẵn giọng tiếc nuối."
      },
      {
        "name": "Trách một việc đã trót làm",
        "sample": "You {shouldn't have said} that in front of everyone.",
        "note": "Dạng phủ định lật ngược lại: việc đã xảy ra rồi, và người nói cho rằng lẽ ra đừng làm."
      },
      {
        "name": "Đã làm rồi mới biết là thừa",
        "sample": "We {needn't have brought} an umbrella; it stayed dry all day.",
        "note": "Khuôn này khẳng định việc đã làm. Nếu việc không cần nên không làm thì phải dùng didn't need to."
      },
      {
        "name": "Không cần nên đã không làm",
        "sample": "Entry was free, so we {didn't need to buy} tickets.",
        "note": "Hoàn cảnh cho biết không cần từ đầu, và ta đã không làm. Đây là chỗ hay bị lẫn với needn't have V3."
      },
      {
        "name": "Việc lẽ ra đã xảy ra nếu hoàn cảnh khác",
        "sample": "I {would have called} you, but my phone was dead.",
        "note": "would have + V3 nói về một kết quả đã bị chặn lại, thường đi kèm một lý do ở quá khứ."
      },
      {
        "name": "Đoán về việc đang diễn ra ở quá khứ",
        "sample": "She {must have been waiting} for hours when we arrived.",
        "note": "Thêm been + V-ing khi muốn nhấn vào quá trình kéo dài chứ không phải một việc gọn."
      }
    ],
    "traps": [
      {
        "wrong": "She must had forgotten our meeting.",
        "right": "She must have forgotten our meeting.",
        "why": "Tiếng Việt gắn chữ “đã” ngay sau “chắc là”, nên người học chia luôn modal. Modal không bao giờ chia, dấu hiệu quá khứ nằm ở have + V3."
      },
      {
        "wrong": "I should have went to the doctor sooner.",
        "right": "I should have gone to the doctor sooner.",
        "why": "Sau have bắt buộc là V3. went là quá khứ đơn nên không đứng được ở vị trí này."
      },
      {
        "wrong": "He must be very tired yesterday.",
        "right": "He must have been very tired yesterday.",
        "why": "Có mốc quá khứ yesterday thì suy đoán cũng phải lùi về quá khứ, không dùng must be."
      },
      {
        "wrong": "She can't finished the report so quickly.",
        "right": "She can't have finished the report so quickly.",
        "why": "Thiếu have thì câu thành “cô ấy không thể finished”, sai cả về dạng lẫn về mốc thời gian."
      },
      {
        "wrong": "They may went home early.",
        "right": "They may have gone home early.",
        "why": "Sau modal không bao giờ có V2. Muốn nói về quá khứ thì chèn have rồi mới tới V3."
      },
      {
        "wrong": "We needn't hurry; the train was late.",
        "right": "We needn't have hurried; the train was late.",
        "why": "Ta đã vội rồi mới biết là thừa. needn’t hurry chỉ có nghĩa “bây giờ không cần vội”."
      },
      {
        "wrong": "I would helped you if I had known.",
        "right": "I would have helped you if I had known.",
        "why": "Thiếu have là mất dấu hiệu “việc này đã không xảy ra”, câu bị hiểu thành một giả định về hiện tại."
      }
    ],
    "compare": {
      "with": "Động từ khuyết thiếu ở hiện tại",
      "rows": [
        {
          "key": "Mốc thời gian nói tới",
          "other": "Hiện tại hoặc tương lai",
          "self": "Một việc đã xảy ra hoặc đã không xảy ra"
        },
        {
          "key": "Dạng động từ sau modal",
          "other": "V nguyên thể: must be, should go",
          "self": "have + V3: must have been, should have gone"
        },
        {
          "key": "must",
          "other": "must be — chắc là đang thế",
          "self": "must have been — chắc là đã thế"
        },
        {
          "key": "should",
          "other": "should go — nên đi, còn kịp đi",
          "self": "should have gone — đáng lẽ nên đi nhưng đã không đi"
        },
        {
          "key": "needn't",
          "other": "needn't go — không cần đi",
          "self": "needn't have gone — đã đi rồi mà hoá ra không cần"
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Quen khuôn modal + V nên bỏ luôn have",
          "self": "Đem chữ “đã” đặt vào modal: must had, should had, would had"
        }
      ]
    },
    "items": [
      {
        "id": "modal-perfect-1",
        "kind": "cloze",
        "prompt": "The lights are off, so she ___ to bed. ",
        "answers": [
          "must have gone"
        ],
        "cue": "go",
        "explain": "Có bằng chứng trước mắt nên đây là suy đoán gần như chắc chắn về việc đã rồi.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-2",
        "kind": "mcq",
        "prompt": "He looks exhausted. He ___ all night.",
        "answers": [
          "must have worked"
        ],
        "options": [
          "must have worked",
          "must worked",
          "must had worked",
          "must work"
        ],
        "explain": "Modal giữ nguyên dạng, dấu hiệu quá khứ nằm ở have cộng với dạng V3.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-3",
        "kind": "cloze",
        "prompt": "She must ___ her phone at the office.",
        "answers": [
          "have left"
        ],
        "explain": "Sau một modal luôn là dạng nguyên thể, nên have không được chia.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-4",
        "kind": "cloze",
        "prompt": "The ground is wet, so it ___ during the night. ",
        "answers": [
          "must have rained"
        ],
        "cue": "rain",
        "explain": "Hiện trạng bây giờ là kết quả, còn nguyên nhân nằm ở đêm qua.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-5",
        "kind": "cloze",
        "prompt": "You look tired. You ___ up very late.",
        "answers": [
          "must have stayed"
        ],
        "explain": "Bỏ have thì câu mất hẳn mốc quá khứ và modal cũng không đứng được trước V2.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-6",
        "kind": "cloze",
        "prompt": "Nobody answered the door, so they ___ out. ",
        "answers": [
          "must have been"
        ],
        "cue": "be",
        "explain": "Cần đủ ba phần must, have và dạng V3 của be để nói về một trạng thái đã qua.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-7",
        "kind": "mcq",
        "prompt": "He ___ me; I was at home all evening.",
        "answers": [
          "can't have seen"
        ],
        "options": [
          "can't have seen",
          "can't saw",
          "can't had seen",
          "couldn't saw"
        ],
        "explain": "Bằng chứng ngoại phạm rất chắc nên đây là lời bác bỏ, mặt trái của must have.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-8",
        "kind": "cloze",
        "prompt": "They ___ at the party; their car was outside all night.",
        "answers": [
          "can't have been"
        ],
        "explain": "Thiếu have thì cụm can't been không thành cấu trúc nào cả.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-9",
        "kind": "cloze",
        "prompt": "She ___ the whole book in one hour. ",
        "answers": [
          "can't have finished"
        ],
        "cue": "finish",
        "explain": "Người nói cho rằng chuyện đó gần như không thể xảy ra, chứ không phải chỉ nghi ngờ.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-10",
        "kind": "mcq",
        "prompt": "I'm not sure where my keys are. I ___ them in the car.",
        "answers": [
          "may have left"
        ],
        "options": [
          "may have left",
          "may left",
          "may had left",
          "may leave"
        ],
        "explain": "Câu để ngỏ khả năng, và việc bỏ quên đã xảy ra rồi nên cần have kèm V3.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-11",
        "kind": "cloze",
        "prompt": "They ___ the wrong bus. ",
        "answers": [
          "might have taken"
        ],
        "cue": "take",
        "explain": "Người nói chỉ đoán chừng, không có bằng chứng nào chắc chắn.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-12",
        "kind": "cloze",
        "prompt": "She ___ home early, but nobody saw her leave.",
        "answers": [
          "could have gone"
        ],
        "explain": "Modal không đi cùng V2. Khả năng về quá khứ cần have rồi mới tới V3.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-13",
        "kind": "cloze",
        "prompt": "I ___ the tickets earlier; now they are sold out. ",
        "answers": [
          "should have booked"
        ],
        "cue": "book",
        "explain": "Việc đặt vé đã không diễn ra và giờ đã muộn, nên câu mang nghĩa tiếc nuối.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-14",
        "kind": "mcq",
        "prompt": "You ___ her about the surprise.",
        "answers": [
          "shouldn't have told"
        ],
        "options": [
          "shouldn't have told",
          "shouldn't tell",
          "shouldn't have telled",
          "shouldn't told"
        ],
        "explain": "Chuyện đã lỡ nói ra rồi, người nói đang trách chứ không đang khuyên.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-15",
        "kind": "cloze",
        "prompt": "We should ___ to the doctor much sooner.",
        "answers": [
          "have gone"
        ],
        "explain": "Vị trí sau have chỉ nhận V3, và V3 của go không phải là went.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-16",
        "kind": "cloze",
        "prompt": "Your face is red. You ___ sun cream. ",
        "answers": [
          "should have used"
        ],
        "cue": "use",
        "explain": "Hậu quả đã thấy rõ nên lời khuyên được nói ngược về một việc đã bỏ lỡ.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-17",
        "kind": "mcq",
        "prompt": "I ___ you before coming.",
        "answers": [
          "ought to have called"
        ],
        "options": [
          "ought to have called",
          "ought have called",
          "ought to called",
          "ought to call"
        ],
        "explain": "ought luôn kéo theo to, và phần sau to vẫn là have cộng V3.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-18",
        "kind": "cloze",
        "prompt": "We ___; the train was thirty minutes late. ",
        "answers": [
          "needn't have hurried"
        ],
        "cue": "hurry",
        "explain": "Ta đã vội thật, chỉ là hoá ra công đó thừa.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-19",
        "kind": "mcq",
        "prompt": "Entry was free, so we ___ tickets.",
        "answers": [
          "didn't need to buy"
        ],
        "options": [
          "didn't need to buy",
          "needn't have bought",
          "didn't needed to buy",
          "not needed to buy"
        ],
        "explain": "Biết là miễn phí từ đầu nên việc mua vé đã không hề diễn ra.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-20",
        "kind": "cloze",
        "prompt": "She ___ because the meeting started late.",
        "answers": [
          "needn't have hurried"
        ],
        "explain": "Sau needn't phải là dạng nguyên thể have, rồi mới tới V3.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-21",
        "kind": "cloze",
        "prompt": "I ___ you, but I was out of town. ",
        "answers": [
          "would have helped"
        ],
        "cue": "help",
        "explain": "Vế but cho biết việc giúp đã bị chặn lại, tức là đã không xảy ra.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-22",
        "kind": "mcq",
        "prompt": "If she had asked, we ___ her the money.",
        "answers": [
          "would have lent"
        ],
        "options": [
          "would have lent",
          "would lent",
          "would have lend",
          "would lending"
        ],
        "explain": "Vế if ở quá khứ hoàn thành nên vế chính cần đủ would, have và V3.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-23",
        "kind": "cloze",
        "prompt": "They ___ to the wedding if they had known.",
        "answers": [
          "would have come"
        ],
        "explain": "Sau would không dùng V2. Việc đã không xảy ra nên phải chèn have.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-24",
        "kind": "cloze",
        "prompt": "She ___ for an hour when we arrived. ",
        "answers": [
          "must have been waiting"
        ],
        "cue": "wait",
        "explain": "Thêm been và đuôi -ing để nhấn vào khoảng thời gian chờ kéo dài.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-25",
        "kind": "mcq",
        "prompt": "He didn't answer the phone. He ___.",
        "answers": [
          "might have been driving"
        ],
        "options": [
          "might have been driving",
          "might been driving",
          "might have driving",
          "might driving"
        ],
        "explain": "Đoán về một việc đang diễn ra lúc đó, nên cần cả have been lẫn đuôi -ing.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-26",
        "kind": "transform",
        "prompt": "I am sure she forgot our appointment.",
        "answers": [
          "She must have forgotten our appointment."
        ],
        "explain": "Lời khẳng định chắc chắn về quá khứ gói lại thành một suy đoán bằng must.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-27",
        "kind": "transform",
        "prompt": "I am sure he did not see me, because I was at home all evening.",
        "answers": [
          "He can't have seen me, because I was at home all evening."
        ],
        "explain": "Chắc chắn ở dạng phủ định thì dùng can't have, không dùng mustn't have.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-28",
        "kind": "transform",
        "prompt": "I did not book a table, and now there are no seats left.",
        "answers": [
          "I should have booked a table."
        ],
        "explain": "Việc bỏ lỡ cộng với hậu quả khó chịu ở hiện tại chính là nghĩa của should have.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-29",
        "kind": "transform",
        "prompt": "We brought an umbrella, but it did not rain at all.",
        "answers": [
          "We needn't have brought an umbrella."
        ],
        "explain": "Ta đã mang ô thật, chỉ là công đó thành thừa.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "modal-perfect-30",
        "kind": "transform",
        "prompt": "Perhaps they took the wrong turning.",
        "answers": [
          "They might have taken the wrong turning."
        ],
        "explain": "perhaps chuyển thành một modal để ngỏ khả năng, kèm have và V3 cho mốc quá khứ.",
        "errorTag": "Nhầm thì"
      }
    ]
  },
  {
    "key": "wish-clauses",
    "builtin": true,
    "name": "Câu ước — wish / if only",
    "nameEn": "Wish and if only",
    "level": "B2",
    "group": "Câu phức",
    "description": "Nói về điều mình mong nhưng không có thật. Tiếng Việt nói “ước gì tôi có nhiều thời gian” ở ngay thì hiện tại nên người học bê nguyên sang tiếng Anh, quên mất rằng sau wish phải lùi một thì để đánh dấu “chuyện này không đúng với thực tế”.",
    "icon": "sparkle",
    "tags": [
      "Nhầm thì"
    ],
    "signals": [
      "wish",
      "if only",
      "were",
      "had",
      "would",
      "could",
      "hope",
      "it's time",
      "I'd rather"
    ],
    "formulas": [
      {
        "form": "Ước trái với hiện tại",
        "structure": "S + wish + S + V quá khứ đơn / were",
        "example": "I wish I had more free time."
      },
      {
        "form": "Tiếc nuối một việc đã qua",
        "structure": "S + wish + S + had + V3",
        "example": "I wish I had studied harder at school."
      },
      {
        "form": "Mong người khác đổi thói quen",
        "structure": "S + wish + S + would + V",
        "example": "I wish you would stop interrupting me."
      },
      {
        "form": "Ước một khả năng mình không có",
        "structure": "S + wish + S + could + V",
        "example": "I wish I could speak Japanese."
      },
      {
        "form": "If only — cùng cơ chế, giọng mạnh hơn",
        "structure": "If only + S + V quá khứ đơn / had + V3",
        "example": "If only I knew her phone number."
      },
      {
        "form": "Đã đến lúc phải làm gì đó",
        "structure": "It's time + S + V quá khứ đơn",
        "example": "It's time we went home."
      }
    ],
    "uses": [
      {
        "name": "Ước điều trái với hiện tại",
        "sample": "I wish I {had} more free time to read every day.",
        "note": "Sự thật là tôi đang không có thời gian. Lùi về quá khứ đơn chính là cách đánh dấu điều đó không có thật."
      },
      {
        "name": "Ước mình ở hoàn cảnh khác",
        "sample": "I wish I {were} a bit taller.",
        "note": "Trong câu ước, were dùng cho mọi ngôi kể cả I, he, she. Đây là dấu vết của thức giả định."
      },
      {
        "name": "Tiếc nuối một việc đã qua",
        "sample": "I wish I {had listened} to your advice last week.",
        "note": "Chuyện đã rồi nên lùi thêm một bậc nữa, về quá khứ hoàn thành."
      },
      {
        "name": "Khó chịu vì thói quen của người khác",
        "sample": "I wish you {would stop} interrupting me.",
        "note": "would ở đây mang giọng phàn nàn, mong đối phương đổi cách cư xử. Không dùng cho chính mình."
      },
      {
        "name": "Ước một khả năng mình không có",
        "sample": "I wish I {could speak} Japanese fluently.",
        "note": "could là dạng lùi thì của can, dùng khi điều mình ước là một năng lực."
      },
      {
        "name": "Nhấn mạnh hơn với if only",
        "sample": "If only I {had known} about the traffic!",
        "note": "if only mạnh hơn wish về giọng điệu nhưng cơ chế thì và cách lùi thì hoàn toàn giống nhau."
      },
      {
        "name": "Việc còn có thể xảy ra thì dùng hope",
        "sample": "I {hope} you have a safe trip tomorrow.",
        "note": "hope nói về điều còn ngỏ nên giữ hiện tại hoặc tương lai. wish chỉ dành cho điều đã trái thực tế."
      },
      {
        "name": "Đã đến lúc phải làm gì đó",
        "sample": "It's time we {went} home; it is nearly midnight.",
        "note": "Cấu trúc này cũng mượn quá khứ đơn để nói về hiện tại, hàm ý việc lẽ ra phải làm rồi mà chưa làm."
      }
    ],
    "traps": [
      {
        "wrong": "I wish I have a bigger house.",
        "right": "I wish I had a bigger house.",
        "why": "Tiếng Việt nói “ước gì tôi có một ngôi nhà lớn hơn” ở ngay thì hiện tại, nên người học bê nguyên sang và bỏ mất bước lùi thì."
      },
      {
        "wrong": "I wish I was taller.",
        "right": "I wish I were taller.",
        "why": "Trong câu ước, were dùng cho mọi ngôi. Dạng was chỉ nghe được trong lời nói rất suồng sã."
      },
      {
        "wrong": "I wish I would have more free time.",
        "right": "I wish I had more free time.",
        "why": "wish + would chỉ dành cho việc mong người khác đổi thói quen. Ước cho chính mình thì dùng quá khứ đơn."
      },
      {
        "wrong": "I wish I have listened to your advice.",
        "right": "I wish I had listened to your advice.",
        "why": "Chuyện đã qua thì lùi thêm một bậc nữa. Hiện tại hoàn thành không dùng được sau wish."
      },
      {
        "wrong": "I wish you will call me more often.",
        "right": "I wish you would call me more often.",
        "why": "will không đứng sau wish. Muốn phàn nàn về thói quen của ai đó thì dùng would."
      },
      {
        "wrong": "I wish you have a nice trip.",
        "right": "I hope you have a nice trip.",
        "why": "Chuyến đi còn chưa diễn ra nên vẫn có thể tốt đẹp. Điều còn ngỏ thì dùng hope, không dùng wish."
      },
      {
        "wrong": "It's time we go home.",
        "right": "It's time we went home.",
        "why": "Cấu trúc này cũng mượn quá khứ đơn để nói về hiện tại, giống hệt cách wish lùi thì."
      }
    ],
    "compare": {
      "with": "Câu điều kiện loại 2 & 3",
      "rows": [
        {
          "key": "Điều muốn diễn đạt",
          "other": "Nếu A thì B — nêu điều kiện rồi nêu hệ quả",
          "self": "Chỉ nêu điều mình mong, không kèm hệ quả"
        },
        {
          "key": "Khuôn câu",
          "other": "If + S + V lùi thì, S + would + V",
          "self": "wish / if only + S + V lùi thì, không có vế would riêng"
        },
        {
          "key": "Nói về hiện tại",
          "other": "If I had a car, I would drive you there.",
          "self": "I wish I had a car."
        },
        {
          "key": "Nói về quá khứ",
          "other": "If I had left earlier, I would have caught the bus.",
          "self": "I wish I had left earlier."
        },
        {
          "key": "Vai trò của would",
          "other": "Đứng ở vế chính để nêu hệ quả",
          "self": "Chỉ dùng khi mong người khác đổi hành vi, không dùng cho chính mình"
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Đem would đặt nhầm vào vế if",
          "self": "Giữ nguyên thì hiện tại sau wish vì tiếng Việt nói “ước gì tôi có”"
        }
      ]
    },
    "items": [
      {
        "id": "wish-clauses-1",
        "kind": "cloze",
        "prompt": "I wish I ___ more free time to read every day. ",
        "answers": [
          "had"
        ],
        "cue": "have",
        "explain": "Sự thật là tôi đang không có, nên phải lùi một thì để đánh dấu điều trái thực tế.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-2",
        "kind": "mcq",
        "prompt": "I wish I ___ Vietnamese as well as you do.",
        "answers": [
          "spoke"
        ],
        "options": [
          "spoke",
          "speak",
          "will speak",
          "am speaking"
        ],
        "explain": "Điều ước nói về hiện tại nhưng động từ vẫn phải lùi về quá khứ đơn.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-3",
        "kind": "correct",
        "prompt": "I wish I have a car so that I could drive to work.",
        "answers": [
          "had"
        ],
        "tokens": [
          "I",
          "wish",
          "I",
          "have",
          "a",
          "car",
          "so",
          "that",
          "I",
          "could",
          "drive",
          "to",
          "work."
        ],
        "errIndex": 3,
        "explain": "Vế could drive cho thấy đây là giả định, nên động từ phía trước cũng phải lùi thì.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-4",
        "kind": "cloze",
        "prompt": "She wishes she ___ closer to her parents. ",
        "answers": [
          "lived"
        ],
        "cue": "live",
        "explain": "Chủ ngữ she không ảnh hưởng gì, phần sau wish luôn lùi một thì.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-5",
        "kind": "mcq",
        "prompt": "I wish I ___ in your position right now.",
        "answers": [
          "were"
        ],
        "options": [
          "were",
          "am",
          "will be",
          "have been"
        ],
        "explain": "Câu ước dùng thức giả định nên chọn dạng chung cho mọi ngôi.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-6",
        "kind": "correct",
        "prompt": "I wish my brother is here to help us move the sofa.",
        "answers": [
          "were"
        ],
        "tokens": [
          "I",
          "wish",
          "my",
          "brother",
          "is",
          "here",
          "to",
          "help",
          "us",
          "move",
          "the",
          "sofa."
        ],
        "errIndex": 4,
        "explain": "Anh ấy đang không ở đây, và trong câu ước thì mọi ngôi đều dùng chung một dạng.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-7",
        "kind": "cloze",
        "prompt": "I wish I ___ to your advice last week. ",
        "answers": [
          "had listened"
        ],
        "cue": "listen",
        "explain": "Mốc last week đã qua nên phải lùi thêm một bậc nữa.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-8",
        "kind": "mcq",
        "prompt": "I wish I ___ harder when I was at school.",
        "answers": [
          "had studied"
        ],
        "options": [
          "had studied",
          "studied",
          "have studied",
          "would study"
        ],
        "explain": "Chuyện thời đi học đã khép lại, không sửa được nữa nên lùi về quá khứ hoàn thành.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-9",
        "kind": "cloze",
        "prompt": "I wish we ___ the hotel a month earlier.",
        "answers": [
          "had booked"
        ],
        "explain": "Hiện tại hoàn thành không đứng sau wish; tiếc nuối quá khứ luôn dùng had + V3.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-10",
        "kind": "cloze",
        "prompt": "He wishes he ___ the earlier flight to Ha Noi. ",
        "answers": [
          "had taken"
        ],
        "cue": "take",
        "explain": "Chuyến bay đó đã cất cánh rồi nên điều ước hướng về quá khứ.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-11",
        "kind": "mcq",
        "prompt": "She wishes she ___ her old motorbike.",
        "answers": [
          "had not sold"
        ],
        "options": [
          "had not sold",
          "had not selled",
          "did not sell",
          "has not sold"
        ],
        "explain": "Việc bán đã xong, và V3 của sell là dạng bất quy tắc.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-12",
        "kind": "cloze",
        "prompt": "I wish you ___ interrupting me while I am speaking. ",
        "answers": [
          "would stop"
        ],
        "cue": "stop",
        "explain": "Đây là lời phàn nàn về thói quen của người khác, mong họ đổi cách cư xử.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-13",
        "kind": "cloze",
        "prompt": "I wish you ___ me more often.",
        "answers": [
          "would call"
        ],
        "explain": "will không đứng được sau wish, dạng lùi thì của nó mới đúng.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-14",
        "kind": "mcq",
        "prompt": "I wish I ___ more patience with my little brother.",
        "answers": [
          "had"
        ],
        "options": [
          "had",
          "would have",
          "will have",
          "am having"
        ],
        "explain": "Không dùng would cho chính mình, vì mình không thể tự phàn nàn về thói quen của bản thân.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-15",
        "kind": "cloze",
        "prompt": "I wish the neighbours ___ the music down after midnight. ",
        "answers": [
          "would turn"
        ],
        "cue": "turn",
        "explain": "Người khác mới là người có thể thay đổi hành vi đó.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-16",
        "kind": "cloze",
        "prompt": "I wish I ___ Japanese fluently. ",
        "answers": [
          "could speak"
        ],
        "cue": "can speak",
        "explain": "Điều ước là một năng lực nên dùng dạng lùi thì của can.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-17",
        "kind": "cloze",
        "prompt": "I wish I ___ to your wedding next month.",
        "answers": [
          "could come"
        ],
        "explain": "Sau wish thì can phải lùi thành could dù việc nói tới nằm ở tương lai.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-18",
        "kind": "cloze",
        "prompt": "I wish I ___ with you to Da Lat last summer. ",
        "answers": [
          "could have gone"
        ],
        "cue": "can go",
        "explain": "Chuyến đi đã qua nên khả năng cũng phải lùi về mốc quá khứ.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-19",
        "kind": "cloze",
        "prompt": "If only I ___ her phone number, I would ring her now. ",
        "answers": [
          "knew"
        ],
        "cue": "know",
        "explain": "if only chạy đúng cơ chế của wish, và điều trái hiện tại thì lùi về quá khứ đơn.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-20",
        "kind": "mcq",
        "prompt": "If only we ___ earlier, we would not have missed the train.",
        "answers": [
          "had left"
        ],
        "options": [
          "had left",
          "left",
          "leave",
          "would leave"
        ],
        "explain": "Vế sau có would not have missed nên điều tiếc nuối nằm hẳn ở quá khứ.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-21",
        "kind": "cloze",
        "prompt": "If only I ___ that to her yesterday.",
        "answers": [
          "hadn't said"
        ],
        "explain": "Lời đã nói ra hôm qua, tiếc chuyện đã rồi thì lùi về quá khứ hoàn thành.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-22",
        "kind": "mcq",
        "prompt": "I ___ you have a safe trip tomorrow.",
        "answers": [
          "hope"
        ],
        "options": [
          "hope",
          "wish",
          "hoped",
          "wished"
        ],
        "explain": "Chuyến đi chưa diễn ra và hoàn toàn có thể suôn sẻ, nên đây không phải điều trái thực tế.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-23",
        "kind": "correct",
        "prompt": "I wish you feel better soon.",
        "answers": [
          "hope"
        ],
        "tokens": [
          "I",
          "wish",
          "you",
          "feel",
          "better",
          "soon."
        ],
        "errIndex": 1,
        "explain": "Việc khoẻ lại vẫn còn khả năng xảy ra, nên dùng động từ dành cho điều còn ngỏ.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-24",
        "kind": "cloze",
        "prompt": "It's time we ___ home; it is nearly midnight. ",
        "answers": [
          "went"
        ],
        "cue": "go",
        "explain": "Cấu trúc này mượn quá khứ đơn để nói việc lẽ ra phải làm từ nãy.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-25",
        "kind": "mcq",
        "prompt": "It's time you ___ this problem seriously.",
        "answers": [
          "took"
        ],
        "options": [
          "took",
          "take",
          "are taking",
          "will take"
        ],
        "explain": "Câu hàm ý bạn vẫn chưa làm, nên động từ lùi thì y như sau wish.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-26",
        "kind": "transform",
        "prompt": "I am sorry I do not have a bigger flat.",
        "answers": [
          "I wish I had a bigger flat."
        ],
        "explain": "Chuyển lời tiếc về hiện tại thành câu ước, bỏ phủ định và lùi một thì.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-27",
        "kind": "transform",
        "prompt": "I am not tall enough to reach the top shelf.",
        "answers": [
          "I wish I were taller."
        ],
        "explain": "Đổi câu tả thực tế thành điều ước, dùng dạng chung cho mọi ngôi.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-28",
        "kind": "transform",
        "prompt": "I did not book the tickets early, and now they are sold out.",
        "answers": [
          "I wish I had booked the tickets earlier."
        ],
        "explain": "Việc bỏ lỡ nằm ở quá khứ nên điều ước phải lùi về quá khứ hoàn thành.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-29",
        "kind": "transform",
        "prompt": "My flatmate never washes the dishes and it really annoys me.",
        "answers": [
          "I wish my flatmate would wash the dishes."
        ],
        "explain": "Phàn nàn về thói quen của người khác thì dùng khuôn wish + would.",
        "errorTag": "Nhầm thì"
      },
      {
        "id": "wish-clauses-30",
        "kind": "transform",
        "prompt": "I cannot play the piano, and I really regret it.",
        "answers": [
          "I wish I could play the piano."
        ],
        "explain": "Điều ước về một năng lực mình không có nên dùng dạng lùi thì của can.",
        "errorTag": "Nhầm thì"
      }
    ]
  },
  {
    "key": "participle-clauses",
    "builtin": true,
    "name": "Mệnh đề rút gọn (participle clauses)",
    "nameEn": "Participle clauses",
    "level": "B2",
    "group": "Câu phức",
    "description": "Bỏ chủ ngữ và động từ chia thì của một mệnh đề, chỉ giữ lại V-ing hoặc V3 cho câu gọn. Tiếng Việt không đánh dấu chủ động hay bị động ở động từ nên người học hay rút nhầm dạng, hoặc rút xong lại để cụm đó treo vào một chủ ngữ khác.",
    "icon": "layers",
    "tags": [
      "Trật tự từ"
    ],
    "signals": [
      "having",
      "being",
      "when",
      "while",
      "after",
      "before",
      "since",
      "who",
      "which",
      "that"
    ],
    "formulas": [
      {
        "form": "Rút gọn mệnh đề quan hệ chủ động",
        "structure": "N + V-ing (thay cho who / which + V chủ động)",
        "example": "The man standing at the gate is my uncle."
      },
      {
        "form": "Rút gọn mệnh đề quan hệ bị động",
        "structure": "N + V3 (thay cho who / which + be + V3)",
        "example": "The letter written in 1920 is still easy to read."
      },
      {
        "form": "Hai việc cùng lúc, hoặc nêu nguyên nhân",
        "structure": "V-ing…, S + V",
        "example": "Walking home from work, I met an old friend."
      },
      {
        "form": "Việc xảy ra trước",
        "structure": "Having + V3…, S + V",
        "example": "Having finished the report, she went home early."
      },
      {
        "form": "Bị động và xảy ra trước",
        "structure": "Having been + V3…, S + V",
        "example": "Having been warned about the storm, we stayed at home."
      },
      {
        "form": "Giữ lại liên từ cho rõ nghĩa",
        "structure": "When / While / After / Before / Since + V-ing…, S + V",
        "example": "While waiting for the bus, I read the morning news."
      },
      {
        "form": "Cụm bị động mở đầu câu",
        "structure": "(Being) + V3…, S + V",
        "example": "Written in very simple English, the book sells well."
      }
    ],
    "uses": [
      {
        "name": "Rút gọn mệnh đề quan hệ chủ động",
        "sample": "The man {standing} at the gate is my uncle.",
        "note": "Thay cho who is standing. Ông ấy tự đứng nên dùng V-ing."
      },
      {
        "name": "Rút gọn mệnh đề quan hệ bị động",
        "sample": "The email {sent} yesterday has not been answered.",
        "note": "Thay cho which was sent. Email được gửi chứ không tự gửi nên dùng V3."
      },
      {
        "name": "Hai việc xảy ra cùng lúc",
        "sample": "{Walking} home from work, I met an old friend.",
        "note": "Cụm V-ing và mệnh đề chính cùng chủ ngữ là tôi, nên không cần nhắc lại chủ ngữ."
      },
      {
        "name": "Nêu nguyên nhân",
        "sample": "{Not knowing} the way, we asked a policeman.",
        "note": "Cụm rút gọn thay cho because we did not know. Chữ not đặt ngay trước V-ing."
      },
      {
        "name": "Việc xảy ra trước rồi mới tới việc sau",
        "sample": "{Having finished} the report, she went home early.",
        "note": "Having + V3 tách rõ hai mốc: xong báo cáo trước, về nhà sau."
      },
      {
        "name": "Bị động và xảy ra trước",
        "sample": "{Having been warned} about the storm, we stayed at home.",
        "note": "Chúng tôi được cảnh báo, và việc đó xảy ra trước khi ở nhà, nên cần đủ having been + V3."
      },
      {
        "name": "Giữ lại liên từ cho rõ quan hệ",
        "sample": "While {waiting} for the bus, I read the morning news.",
        "note": "Giữ while giúp người đọc thấy ngay đây là quan hệ thời gian. Sau liên từ luôn là V-ing."
      },
      {
        "name": "Cụm bị động mở đầu câu",
        "sample": "{Written} in very simple English, the book sells well.",
        "note": "Chủ ngữ the book là thứ được viết, nên cụm mở đầu ở dạng V3. Có thể thêm Being ở trước."
      }
    ],
    "traps": [
      {
        "wrong": "The letter writing in 1920 is still readable.",
        "right": "The letter written in 1920 is still readable.",
        "why": "Bức thư được viết chứ không tự viết. Tiếng Việt nói “bức thư viết năm 1920” không phân biệt chủ động hay bị động nên người học chọn nhầm V-ing."
      },
      {
        "wrong": "The man stood at the gate is my uncle.",
        "right": "The man standing at the gate is my uncle.",
        "why": "Ông ấy tự đứng nên phải dùng V-ing. Dạng V3 ở đây bị hiểu thành “người đàn ông bị đứng”."
      },
      {
        "wrong": "Walking down the street, a dog bit me.",
        "right": "Walking down the street, I was bitten by a dog.",
        "why": "Chủ ngữ của cụm V-ing phải trùng chủ ngữ mệnh đề chính. Viết như câu sai thì hoá ra con chó đang đi bộ."
      },
      {
        "wrong": "After finished the report, she went home.",
        "right": "After finishing the report, she went home.",
        "why": "Sau liên từ trong mệnh đề rút gọn luôn là V-ing, không phải V2 hay V3."
      },
      {
        "wrong": "Having been finished the homework, he went out.",
        "right": "Having finished the homework, he went out.",
        "why": "Cậu ấy làm bài chứ không bị ai làm. Thêm been là biến câu chủ động thành bị động."
      },
      {
        "wrong": "While I waiting for the bus, I read the news.",
        "right": "While waiting for the bus, I read the news.",
        "why": "Đã rút gọn thì bỏ luôn chủ ngữ. Giữ lại I mà không có động từ chia thì là câu dở dang."
      },
      {
        "wrong": "Not know the way, we asked a policeman.",
        "right": "Not knowing the way, we asked a policeman.",
        "why": "Động từ mở đầu cụm rút gọn phải ở dạng V-ing, và chữ not đứng ngay trước nó."
      }
    ],
    "compare": {
      "with": "Mệnh đề đầy đủ",
      "rows": [
        {
          "key": "Thành phần của mệnh đề",
          "other": "Có chủ ngữ riêng và động từ chia thì",
          "self": "Chỉ còn V-ing hoặc V3, không có chủ ngữ riêng"
        },
        {
          "key": "Dạng chủ động",
          "other": "The man who is standing at the gate",
          "self": "The man standing at the gate"
        },
        {
          "key": "Dạng bị động",
          "other": "The letter which was written in 1920",
          "self": "The letter written in 1920"
        },
        {
          "key": "Việc xảy ra trước",
          "other": "After she had finished the report, she went home.",
          "self": "Having finished the report, she went home."
        },
        {
          "key": "Yêu cầu về chủ ngữ",
          "other": "Hai mệnh đề có thể khác chủ ngữ",
          "self": "Bắt buộc cùng một chủ ngữ, khác là câu hỏng nghĩa"
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Viết dài, lặp chủ ngữ và giữ nguyên who, which",
          "self": "Rút xong lại đổi chủ ngữ, hoặc dùng V-ing cho ý bị động"
        }
      ]
    },
    "items": [
      {
        "id": "participle-clauses-1",
        "kind": "cloze",
        "prompt": "The man ___ at the gate is my uncle. ",
        "answers": [
          "standing"
        ],
        "cue": "stand",
        "explain": "Ông ấy tự đứng nên cụm rút gọn ở dạng chủ động.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-2",
        "kind": "mcq",
        "prompt": "The girl ___ next to Lan is her cousin.",
        "answers": [
          "sitting"
        ],
        "options": [
          "sitting",
          "sat",
          "sits",
          "is sitting"
        ],
        "explain": "Thay cho who is sitting, và mệnh đề rút gọn không còn động từ chia thì.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-3",
        "kind": "correct",
        "prompt": "The people waited outside the shop looked cold.",
        "answers": [
          "waiting"
        ],
        "tokens": [
          "The",
          "people",
          "waited",
          "outside",
          "the",
          "shop",
          "looked",
          "cold."
        ],
        "errIndex": 2,
        "explain": "Họ tự đứng đợi chứ không bị ai bắt đợi, nên phải dùng dạng chủ động.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-4",
        "kind": "mcq",
        "prompt": "Anyone ___ a ticket should queue at the door.",
        "answers": [
          "wanting"
        ],
        "options": [
          "wanting",
          "wanted",
          "wants",
          "want"
        ],
        "explain": "Thay cho who wants, và câu đã có một động từ chia thì là should queue rồi.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-5",
        "kind": "cloze",
        "prompt": "The letter ___ in 1920 is still easy to read. ",
        "answers": [
          "written"
        ],
        "cue": "write",
        "explain": "Bức thư là thứ được viết ra, nên cụm rút gọn mang nghĩa bị động.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-6",
        "kind": "mcq",
        "prompt": "The email ___ yesterday has not been answered.",
        "answers": [
          "sent"
        ],
        "options": [
          "sent",
          "sending",
          "sends",
          "was sent"
        ],
        "explain": "Email không tự gửi mình đi, và câu đã có động từ chính ở phía sau.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-7",
        "kind": "correct",
        "prompt": "The bridge building in 1975 is still in use.",
        "answers": [
          "built"
        ],
        "tokens": [
          "The",
          "bridge",
          "building",
          "in",
          "1975",
          "is",
          "still",
          "in",
          "use."
        ],
        "errIndex": 2,
        "explain": "Cây cầu được người ta xây chứ không tự xây, nên chọn dạng bị động.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-8",
        "kind": "cloze",
        "prompt": "Most of the phones ___ in that shop are second-hand. ",
        "answers": [
          "sold"
        ],
        "cue": "sell",
        "explain": "Điện thoại là thứ được bán, nên rút gọn thành dạng bị động.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-9",
        "kind": "mcq",
        "prompt": "The students ___ the exam next week must register today.",
        "answers": [
          "taking"
        ],
        "options": [
          "taking",
          "taken",
          "took",
          "take"
        ],
        "explain": "Sinh viên là người đi thi, nên đây là quan hệ chủ động dù nói về tương lai.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-10",
        "kind": "correct",
        "prompt": "We visited an old temple surrounding by tall trees.",
        "answers": [
          "surrounded"
        ],
        "tokens": [
          "We",
          "visited",
          "an",
          "old",
          "temple",
          "surrounding",
          "by",
          "tall",
          "trees."
        ],
        "errIndex": 5,
        "explain": "Ngôi chùa bị cây vây quanh chứ không đi vây ai, và có by ở sau là dấu hiệu bị động.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-11",
        "kind": "cloze",
        "prompt": "The man ___ last night has already been released. ",
        "answers": [
          "arrested"
        ],
        "cue": "arrest",
        "explain": "Ông ta là người bị bắt, nên cụm rút gọn ở dạng bị động.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-12",
        "kind": "cloze",
        "prompt": "___ home from work, I met an old friend. ",
        "answers": [
          "Walking"
        ],
        "cue": "walk",
        "explain": "Người đi bộ và người gặp bạn là cùng một chủ ngữ nên cụm mở đầu ở dạng chủ động.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-13",
        "kind": "mcq",
        "prompt": "___ the way, we asked a policeman.",
        "answers": [
          "Not knowing"
        ],
        "options": [
          "Not knowing",
          "Not know",
          "Do not know",
          "Not to know"
        ],
        "explain": "Cụm rút gọn nêu nguyên nhân, và phủ định đặt ngay trước V-ing.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-14",
        "kind": "correct",
        "prompt": "Feel very tired, she went straight to bed.",
        "answers": [
          "Feeling"
        ],
        "tokens": [
          "Feel",
          "very",
          "tired,",
          "she",
          "went",
          "straight",
          "to",
          "bed."
        ],
        "errIndex": 0,
        "explain": "Mở đầu một mệnh đề rút gọn thì động từ phải mang đuôi -ing chứ không để nguyên thể.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-15",
        "kind": "cloze",
        "prompt": "___ near the sea, they swim every morning. ",
        "answers": [
          "Living"
        ],
        "cue": "live",
        "explain": "Cụm này nêu lý do vì sao họ bơi được mỗi sáng, và chủ ngữ hai vế trùng nhau.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-16",
        "kind": "cloze",
        "prompt": "___ the report, she went home early. ",
        "answers": [
          "Having finished"
        ],
        "cue": "finish",
        "explain": "Cần tách rõ hai mốc: xong báo cáo trước rồi mới về nhà.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-17",
        "kind": "mcq",
        "prompt": "___ the last bus, we had to walk home.",
        "answers": [
          "Having missed"
        ],
        "options": [
          "Having missed",
          "Having been missed",
          "Have missed",
          "Had missed"
        ],
        "explain": "Lỡ xe xảy ra trước việc phải đi bộ, và chúng tôi là người lỡ chứ không bị lỡ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-18",
        "kind": "cloze",
        "prompt": "___ her homework, Mai went out with her friends.",
        "answers": [
          "Having finished"
        ],
        "explain": "Mai tự làm bài chứ không bị ai làm hộ, nên không chèn been vào.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-19",
        "kind": "cloze",
        "prompt": "___ about the storm, we stayed at home. ",
        "answers": [
          "Having been warned"
        ],
        "cue": "warn",
        "explain": "Chúng tôi là bên nhận lời cảnh báo, và việc đó diễn ra trước khi ở nhà.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-20",
        "kind": "cloze",
        "prompt": "While ___ for the bus, I read the morning news. ",
        "answers": [
          "waiting"
        ],
        "cue": "wait",
        "explain": "Giữ lại liên từ để rõ quan hệ thời gian, phần sau nó luôn là V-ing.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-21",
        "kind": "mcq",
        "prompt": "After ___ the meeting, we went out for lunch.",
        "answers": [
          "finishing"
        ],
        "options": [
          "finishing",
          "finished",
          "finish",
          "to finish"
        ],
        "explain": "Sau liên từ trong mệnh đề rút gọn chỉ có một dạng động từ được dùng.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-22",
        "kind": "correct",
        "prompt": "Since move to Da Nang, she has been much happier.",
        "answers": [
          "moving"
        ],
        "tokens": [
          "Since",
          "move",
          "to",
          "Da",
          "Nang,",
          "she",
          "has",
          "been",
          "much",
          "happier."
        ],
        "errIndex": 1,
        "explain": "Đã bỏ chủ ngữ thì động từ theo sau since phải chuyển sang dạng V-ing.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-23",
        "kind": "mcq",
        "prompt": "Walking down the street, ___.",
        "answers": [
          "I was bitten by a dog"
        ],
        "options": [
          "I was bitten by a dog",
          "a dog bit me",
          "a dog was biting me",
          "a dog has bitten me"
        ],
        "explain": "Người đang đi bộ phải làm chủ ngữ của mệnh đề chính, nếu không thì hoá ra con chó đi bộ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-24",
        "kind": "cloze",
        "prompt": "Being new in the city, ___.",
        "answers": [
          "Nam found everything strange"
        ],
        "explain": "Người mới đến thành phố là Nam, nên Nam phải đứng làm chủ ngữ mệnh đề chính.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-25",
        "kind": "cloze",
        "prompt": "___ in very simple English, the book sells well among beginners. ",
        "answers": [
          "Written"
        ],
        "cue": "write",
        "explain": "Chủ ngữ the book là thứ được viết ra, nên cụm mở đầu ở dạng bị động.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-26",
        "kind": "transform",
        "prompt": "The man who is standing at the gate is my uncle.",
        "answers": [
          "The man standing at the gate is my uncle."
        ],
        "explain": "Bỏ who is, giữ lại đúng phần V-ing của mệnh đề quan hệ chủ động.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-27",
        "kind": "transform",
        "prompt": "The letter which was written in 1920 is still easy to read.",
        "answers": [
          "The letter written in 1920 is still easy to read."
        ],
        "explain": "Bỏ which was, phần còn lại là V3 nên câu vẫn giữ nghĩa bị động.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-28",
        "kind": "transform",
        "prompt": "After she had finished the report, she went home early.",
        "answers": [
          "Having finished the report, she went home early."
        ],
        "explain": "Hai vế cùng chủ ngữ nên gộp được, và việc xảy ra trước dùng Having + V3.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-29",
        "kind": "transform",
        "prompt": "Because we did not know the way, we asked a policeman.",
        "answers": [
          "Not knowing the way, we asked a policeman."
        ],
        "explain": "Bỏ because và chủ ngữ, chuyển động từ sang V-ing với not đứng trước.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "participle-clauses-30",
        "kind": "transform",
        "prompt": "While I was waiting for the bus, I read the morning news.",
        "answers": [
          "While waiting for the bus, I read the morning news."
        ],
        "explain": "Giữ while cho rõ nghĩa, bỏ chủ ngữ và was rồi để lại V-ing.",
        "errorTag": "Trật tự từ"
      }
    ]
  },
  {
    "key": "word-formation",
    "builtin": true,
    "name": "Word formation — tiền tố & hậu tố",
    "nameEn": "Word formation",
    "level": "B2",
    "group": "Động từ & cấu trúc",
    "description": "Đổi dạng của một từ cho khớp với vị trí của nó trong câu — thêm hậu tố để ra danh từ, tính từ, trạng từ hay động từ, thêm tiền tố để đổi nghĩa. Tiếng Việt đánh dấu từ loại bằng một từ đứng riêng như “sự”, “tính”, “một cách”, còn bản thân từ giữ nguyên, nên người học quen để nguyên từ gốc ở mọi vị trí.",
    "icon": "type",
    "tags": [],
    "signals": [
      "-tion",
      "-ment",
      "-ness",
      "-ity",
      "-ful",
      "-less",
      "-able",
      "-ly",
      "un-",
      "in-"
    ],
    "formulas": [
      {
        "form": "Danh từ hoá động từ",
        "structure": "V + -tion / -sion / -ment / -ance",
        "example": "The management thanked us for our patience."
      },
      {
        "form": "Danh từ hoá tính từ",
        "structure": "Adj + -ness / -ity",
        "example": "Her kindness surprised us, and so did her generosity."
      },
      {
        "form": "Danh từ chỉ người và quan hệ",
        "structure": "V + -er / -or · N + -ist / -ship",
        "example": "A good teacher builds a friendship with every student."
      },
      {
        "form": "Tính từ hoá danh từ",
        "structure": "N + -ful / -less / -ous / -al / -ic · V + -able / -ive",
        "example": "The advice was helpful, but the old map was useless."
      },
      {
        "form": "Trạng từ hoá tính từ",
        "structure": "Adj + -ly",
        "example": "She answered every question politely and clearly."
      },
      {
        "form": "Động từ hoá",
        "structure": "N / Adj + -ise · -en · -ify",
        "example": "We should modernise the system and simplify the form."
      },
      {
        "form": "Tiền tố phủ định và tiền tố nghĩa",
        "structure": "un- / in- / im- / ir- / il- / dis- / mis- · over- / under- / re- / pre- / co- + từ gốc",
        "example": "It is impossible to reuse the old form, so I rewrote it last night."
      }
    ],
    "uses": [
      {
        "name": "Sau mạo từ hoặc từ sở hữu thì cần danh từ",
        "sample": "Her {performance} last night was outstanding.",
        "note": "Vị trí ngay sau her chỉ nhận danh từ. Động từ perform phải đổi đuôi trước khi đứng vào chỗ đó."
      },
      {
        "name": "Làm chủ ngữ của câu",
        "sample": "The {development} of the city has been very fast.",
        "note": "Chủ ngữ đứng trước động từ chính bắt buộc là danh từ. Hậu tố -ment biến develop thành danh từ."
      },
      {
        "name": "Chỉ người làm nghề hoặc chỉ quan hệ",
        "sample": "My sister is a {translator} and she values her {friendship} with the whole team.",
        "note": "-er và -or tạo danh từ chỉ người làm việc gì, -ist chỉ người theo một ngành, còn -ship chỉ trạng thái hoặc quan hệ."
      },
      {
        "name": "Đứng trước danh từ hoặc sau to be thì cần tính từ",
        "sample": "The map was {useless}, but the guide was very {helpful}.",
        "note": "Hai vị trí này chỉ nhận tính từ. -less nghĩa là không có, -ful nghĩa là có nhiều."
      },
      {
        "name": "Nói về cách thực hiện một hành động",
        "sample": "He answered every question {politely}.",
        "note": "Phần mô tả cách làm bổ nghĩa cho động từ answered nên phải là trạng từ, tức tính từ cộng thêm -ly."
      },
      {
        "name": "Biến danh từ hoặc tính từ thành hành động",
        "sample": "We should {modernise} the payment system and {simplify} the form.",
        "note": "Sau should là chỗ của động từ. -ise và -ify là hai hậu tố tạo động từ hay gặp nhất, bên cạnh -en trong strengthen."
      },
      {
        "name": "Phủ định gọn bằng tiền tố, chọn theo chữ cái đầu",
        "sample": "The instructions were {unclear} and the deadline was {impossible} to meet.",
        "note": "Thay vì nói not clear, tiếng Anh gắn thẳng tiền tố vào từ. in- đổi thành im- trước m, p, b; thành ir- trước r; thành il- trước l."
      },
      {
        "name": "Tiền tố mang nghĩa riêng",
        "sample": "She {overslept} this morning and had to {rebook} the flight.",
        "note": "over- là quá mức, re- là làm lại. Cùng nhóm còn có under- dưới mức, pre- trước, co- cùng nhau."
      },
      {
        "name": "Cùng gốc nhưng khác đuôi thì khác nghĩa",
        "sample": "A small car is more {economical}, though the {economic} news this week was bad.",
        "note": "economical là tiết kiệm, economic là thuộc nền kinh tế. Đổi từ loại còn kéo theo đổi trọng âm: PHOtograph, phoTOgrapher, photoGRAphic."
      }
    ],
    "traps": [
      {
        "wrong": "The develop of the city is very fast.",
        "right": "The development of the city is very fast.",
        "why": "Tiếng Việt nói “sự phát triển” bằng cách thêm chữ “sự” đứng riêng, còn từ “phát triển” không đổi, nên người học bê nguyên develop vào sau the."
      },
      {
        "wrong": "He is a very success businessman.",
        "right": "He is a very successful businessman.",
        "why": "Chỗ đứng trước danh từ businessman là của tính từ. success là danh từ nên phải đổi sang successful."
      },
      {
        "wrong": "She speaks English very fluent.",
        "right": "She speaks English very fluently.",
        "why": "Tiếng Việt dùng chung một từ cho “trôi chảy” dù nó tả người hay tả cách nói, còn tiếng Anh bắt buộc thêm -ly khi bổ nghĩa cho động từ."
      },
      {
        "wrong": "We had a long discuss about the budget.",
        "right": "We had a long discussion about the budget.",
        "why": "Sau mạo từ a và tính từ long chỉ có thể là danh từ, nên động từ discuss phải chuyển thành discussion."
      },
      {
        "wrong": "The hotel room was small and unconvenient.",
        "right": "The hotel room was small and inconvenient.",
        "why": "un- không dùng được cho mọi từ. Nhóm từ gốc Latin như convenient, complete, correct nhận in-, phải nhớ theo từng từ."
      },
      {
        "wrong": "This is an economic car; it uses very little petrol.",
        "right": "This is an economical car; it uses very little petrol.",
        "why": "Hai từ cùng gốc nhưng chia nghĩa: economical là tiết kiệm, economic là thuộc nền kinh tế."
      },
      {
        "wrong": "She works as a translate for a news website.",
        "right": "She works as a translator for a news website.",
        "why": "Tiếng Việt gọi nghề bằng cách thêm “người” trước động từ, còn tiếng Anh gắn -or hoặc -er vào chính động từ đó."
      }
    ],
    "compare": {
      "with": "Dùng nguyên từ gốc",
      "rows": [
        {
          "key": "Cách đánh dấu từ loại",
          "other": "Giữ nguyên hình thức, thêm một từ đứng riêng như “sự”, “tính”, “một cách”",
          "self": "Gắn hậu tố vào chính từ đó, hình thức của từ thay đổi"
        },
        {
          "key": "Sau the, a, my",
          "other": "the develop of the city",
          "self": "the development of the city"
        },
        {
          "key": "Trước một danh từ",
          "other": "a success businessman",
          "self": "a successful businessman"
        },
        {
          "key": "Bổ nghĩa cho động từ",
          "other": "She sings beautiful.",
          "self": "She sings beautifully."
        },
        {
          "key": "Cách phủ định",
          "other": "Dùng not cho mọi trường hợp: not happy, not possible",
          "self": "Gắn tiền tố chọn theo chữ cái đầu: unhappy, impossible, irregular"
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Câu vẫn hiểu được nên không thấy cần đổi đuôi",
          "self": "Phải nhìn vị trí trong câu để chốt từ loại trước, rồi mới chọn đuôi"
        }
      ]
    },
    "items": [
      {
        "id": "word-formation-1",
        "kind": "cloze",
        "prompt": "Her ___ last night was outstanding. ",
        "answers": [
          "performance"
        ],
        "cue": "perform",
        "explain": "Sau từ sở hữu her là chỗ của danh từ nên động từ phải đổi đuôi."
      },
      {
        "id": "word-formation-2",
        "kind": "mcq",
        "prompt": "The ___ of the city has been very fast.",
        "answers": [
          "development"
        ],
        "options": [
          "development",
          "develop",
          "developed",
          "developer"
        ],
        "explain": "Đứng giữa the và of là vị trí của danh từ chỉ quá trình, không phải danh từ chỉ người."
      },
      {
        "id": "word-formation-3",
        "kind": "correct",
        "prompt": "We had a long discuss about the budget.",
        "answers": [
          "discussion"
        ],
        "tokens": [
          "We",
          "had",
          "a",
          "long",
          "discuss",
          "about",
          "the",
          "budget."
        ],
        "errIndex": 4,
        "explain": "Mạo từ a và tính từ long báo hiệu phía sau bắt buộc là danh từ."
      },
      {
        "id": "word-formation-4",
        "kind": "cloze",
        "prompt": "They are still waiting for the ___ of the new manager. ",
        "answers": [
          "arrival"
        ],
        "cue": "arrive",
        "explain": "Sau the và trước of không đặt được động từ, phải dùng dạng danh từ đuôi -al."
      },
      {
        "id": "word-formation-5",
        "kind": "mcq",
        "prompt": "His ___ surprised everyone in the office.",
        "answers": [
          "kindness"
        ],
        "options": [
          "kindness",
          "kind",
          "kindly",
          "kinder"
        ],
        "explain": "Chủ ngữ đứng trước động từ surprised nên phải là danh từ, ở đây là -ness gắn vào tính từ."
      },
      {
        "id": "word-formation-6",
        "kind": "mcq",
        "prompt": "The ___ of the app grew very fast last year.",
        "answers": [
          "popularity"
        ],
        "options": [
          "popularity",
          "popular",
          "popularly",
          "populate"
        ],
        "explain": "Hậu tố -ity biến tính từ thành danh từ trừu tượng để làm chủ ngữ."
      },
      {
        "id": "word-formation-7",
        "kind": "cloze",
        "prompt": "My sister works as a ___ for a news website. ",
        "answers": [
          "translator"
        ],
        "cue": "translate",
        "explain": "Hậu tố -or tạo danh từ chỉ người làm chính công việc đó."
      },
      {
        "id": "word-formation-8",
        "kind": "correct",
        "prompt": "She wants to be a science when she grows up.",
        "answers": [
          "scientist"
        ],
        "tokens": [
          "She",
          "wants",
          "to",
          "be",
          "a",
          "science",
          "when",
          "she",
          "grows",
          "up."
        ],
        "errIndex": 5,
        "explain": "science là tên ngành, còn người theo ngành đó cần hậu tố -ist."
      },
      {
        "id": "word-formation-9",
        "kind": "cloze",
        "prompt": "These instructions are very ___ for beginners. ",
        "answers": [
          "helpful"
        ],
        "cue": "help",
        "explain": "Sau are cần một tính từ mô tả tính chất, và -ful nghĩa là có nhiều."
      },
      {
        "id": "word-formation-10",
        "kind": "mcq",
        "prompt": "He is a very ___ businessman.",
        "answers": [
          "successful"
        ],
        "options": [
          "successful",
          "success",
          "succeed",
          "succession"
        ],
        "explain": "Trước danh từ businessman chỉ đặt được tính từ."
      },
      {
        "id": "word-formation-11",
        "kind": "correct",
        "prompt": "Be careful, the floor is very danger when it is wet.",
        "answers": [
          "dangerous"
        ],
        "tokens": [
          "Be",
          "careful,",
          "the",
          "floor",
          "is",
          "very",
          "danger",
          "when",
          "it",
          "is",
          "wet."
        ],
        "errIndex": 6,
        "explain": "Sau is và trước when là chỗ tả tính chất, nên danh từ phải chuyển sang đuôi -ous."
      },
      {
        "id": "word-formation-12",
        "kind": "mcq",
        "prompt": "Their new flat is small but quite ___.",
        "answers": [
          "comfortable"
        ],
        "options": [
          "comfortable",
          "comfort",
          "comfortably",
          "comforted"
        ],
        "explain": "Vế sau but nối tiếp small, nên cũng phải là một tính từ tả căn hộ."
      },
      {
        "id": "word-formation-13",
        "kind": "cloze",
        "prompt": "He drives ___ whenever it rains. ",
        "answers": [
          "carefully"
        ],
        "cue": "careful",
        "explain": "Phần nói về cách lái xe bổ nghĩa cho động từ drives nên cần đuôi -ly."
      },
      {
        "id": "word-formation-14",
        "kind": "correct",
        "prompt": "She speaks English very fluent after two years in Sydney.",
        "answers": [
          "fluently"
        ],
        "tokens": [
          "She",
          "speaks",
          "English",
          "very",
          "fluent",
          "after",
          "two",
          "years",
          "in",
          "Sydney."
        ],
        "errIndex": 4,
        "explain": "very ở đây bổ nghĩa cho cách nói chứ không tả người, nên phải dùng trạng từ."
      },
      {
        "id": "word-formation-15",
        "kind": "mcq",
        "prompt": "The team worked ___ under pressure.",
        "answers": [
          "efficiently"
        ],
        "options": [
          "efficiently",
          "efficient",
          "efficiency",
          "efficiencies"
        ],
        "explain": "worked là động từ, phần mô tả cách làm việc đi kèm nó phải là trạng từ."
      },
      {
        "id": "word-formation-16",
        "kind": "cloze",
        "prompt": "The company wants to ___ its payment system. ",
        "answers": [
          "modernise"
        ],
        "cue": "modern",
        "explain": "Sau to là chỗ của động từ nguyên thể, và -ise biến tính từ thành hành động."
      },
      {
        "id": "word-formation-17",
        "kind": "correct",
        "prompt": "We should strength the password before the app goes live.",
        "answers": [
          "strengthen"
        ],
        "tokens": [
          "We",
          "should",
          "strength",
          "the",
          "password",
          "before",
          "the",
          "app",
          "goes",
          "live."
        ],
        "errIndex": 2,
        "explain": "strength là danh từ; muốn nói hành động làm cho mạnh lên thì thêm -en."
      },
      {
        "id": "word-formation-18",
        "kind": "cloze",
        "prompt": "The instructions were ___, so we asked the guide again. ",
        "answers": [
          "unclear"
        ],
        "cue": "clear",
        "explain": "Tiền tố un- phủ định ngay trong từ, gọn và tự nhiên hơn cụm not clear."
      },
      {
        "id": "word-formation-19",
        "kind": "mcq",
        "prompt": "It is ___ to book a table on Saturday.",
        "answers": [
          "impossible"
        ],
        "options": [
          "impossible",
          "unpossible",
          "inpossible",
          "dispossible"
        ],
        "explain": "Đứng trước p thì in- biến thành im- cho dễ đọc."
      },
      {
        "id": "word-formation-20",
        "kind": "correct",
        "prompt": "The hotel room was small and rather unconvenient.",
        "answers": [
          "inconvenient"
        ],
        "tokens": [
          "The",
          "hotel",
          "room",
          "was",
          "small",
          "and",
          "rather",
          "unconvenient."
        ],
        "errIndex": 7,
        "explain": "Nhóm từ gốc Latin như convenient chỉ nhận in-, đây là điểm phải nhớ theo từng từ."
      },
      {
        "id": "word-formation-21",
        "kind": "correct",
        "prompt": "Leaving the children alone in the car was completely unresponsible.",
        "answers": [
          "irresponsible"
        ],
        "tokens": [
          "Leaving",
          "the",
          "children",
          "alone",
          "in",
          "the",
          "car",
          "was",
          "completely",
          "unresponsible."
        ],
        "errIndex": 9,
        "explain": "Đứng trước r thì in- biến thành ir-, giống irregular hay irrelevant."
      },
      {
        "id": "word-formation-22",
        "kind": "cloze",
        "prompt": "He ___ with the plan but said nothing at the meeting. ",
        "answers": [
          "disagreed"
        ],
        "cue": "agree",
        "explain": "Tiền tố dis- tạo nghĩa ngược lại cho các động từ như agree, appear, like."
      },
      {
        "id": "word-formation-23",
        "kind": "cloze",
        "prompt": "Sorry, I ___ your message yesterday. ",
        "answers": [
          "misunderstood"
        ],
        "cue": "understand",
        "explain": "Tiền tố mis- mang nghĩa làm sai, hiểu nhầm chứ không phải phủ định hoàn toàn."
      },
      {
        "id": "word-formation-24",
        "kind": "cloze",
        "prompt": "I ___ this morning and missed the first bus. ",
        "answers": [
          "overslept"
        ],
        "cue": "sleep",
        "explain": "Tiền tố over- nghĩa là quá mức, ở đây là ngủ quá giờ cần dậy."
      },
      {
        "id": "word-formation-25",
        "kind": "mcq",
        "prompt": "Many workers at the factory feel ___ and want a rise.",
        "answers": [
          "underpaid"
        ],
        "options": [
          "underpaid",
          "overpaid",
          "unpaid",
          "repaid"
        ],
        "explain": "Vế sau nói họ đòi tăng lương, nên tiền tố phải mang nghĩa dưới mức xứng đáng."
      },
      {
        "id": "word-formation-26",
        "kind": "mcq",
        "prompt": "A small car is more ___ than a big one.",
        "answers": [
          "economical"
        ],
        "options": [
          "economical",
          "economic",
          "economy",
          "economics"
        ],
        "explain": "Ở đây đang nói chuyện tiết kiệm xăng, không phải chuyện nền kinh tế."
      },
      {
        "id": "word-formation-27",
        "kind": "correct",
        "prompt": "The signing of the treaty was a historical moment for both countries.",
        "answers": [
          "historic"
        ],
        "tokens": [
          "The",
          "signing",
          "of",
          "the",
          "treaty",
          "was",
          "a",
          "historical",
          "moment",
          "for",
          "both",
          "countries."
        ],
        "errIndex": 7,
        "explain": "historic là đáng ghi vào lịch sử, còn historical chỉ đơn thuần thuộc về quá khứ."
      },
      {
        "id": "word-formation-28",
        "kind": "transform",
        "prompt": "The city has developed very quickly.",
        "answers": [
          "The development of the city has been very quick."
        ],
        "explain": "Đưa động từ về dạng danh từ để nó làm chủ ngữ, kéo theo trạng từ đổi thành tính từ."
      },
      {
        "id": "word-formation-29",
        "kind": "transform",
        "prompt": "He explained everything in a very clear way.",
        "answers": [
          "He explained everything very clearly."
        ],
        "explain": "Cụm in a … way rút gọn lại thành một trạng từ đuôi -ly."
      },
      {
        "id": "word-formation-30",
        "kind": "transform",
        "prompt": "This part of the job is not safe.",
        "answers": [
          "This part of the job is unsafe."
        ],
        "explain": "Chuyển phủ định bằng not sang tiền tố gắn thẳng vào tính từ cho gọn."
      },
      {
        "id": "word-formation-31",
        "kind": "transform",
        "prompt": "She translates books for a living.",
        "answers": [
          "She is a translator."
        ],
        "explain": "Hậu tố -or biến động từ chỉ hành động thành danh từ chỉ người làm nghề đó."
      },
      {
        "id": "word-formation-32",
        "kind": "transform",
        "prompt": "We must check all the figures again.",
        "answers": [
          "We must recheck all the figures."
        ],
        "explain": "Tiền tố re- thay cho cả cụm … again mà vẫn giữ nguyên nghĩa làm lại."
      }
    ]
  },
  {
    "key": "inversion",
    "builtin": true,
    "name": "Đảo ngữ & cấu trúc nhấn mạnh",
    "nameEn": "Inversion and emphasis",
    "level": "C1",
    "group": "Trật tự từ & nhấn mạnh",
    "description": "Đưa thành phần cần nhấn lên đầu câu, rồi kéo trợ động từ ra trước chủ ngữ. Tiếng Việt nhấn mạnh bằng cách thêm từ tình thái như “chưa bao giờ”, “mãi đến khi” mà trật tự câu không đổi, nên người học đẩy cụm phủ định lên đầu nhưng vẫn giữ nguyên chủ ngữ trước động từ.",
    "icon": "sparkle",
    "tags": [
      "Trật tự từ"
    ],
    "signals": [
      "never",
      "rarely",
      "seldom",
      "little",
      "hardly",
      "no sooner",
      "not only",
      "not until",
      "under no circumstances",
      "only when"
    ],
    "formulas": [
      {
        "form": "Trạng từ phủ định đứng đầu",
        "structure": "Never / Rarely / Seldom / Little + trợ động từ + S + V",
        "example": "Never have I seen such a beautiful sunset."
      },
      {
        "form": "Not only… but also",
        "structure": "Not only + trợ động từ + S + V, but S + also + V",
        "example": "Not only did he apologise, but he also paid for the damage."
      },
      {
        "form": "No sooner… than · Hardly… when",
        "structure": "No sooner + had + S + V3 + than + S + V2",
        "example": "No sooner had we sat down than the phone rang."
      },
      {
        "form": "Only / Not until đứng đầu",
        "structure": "Only when / Only after / Not until + mệnh đề + trợ động từ + S + V",
        "example": "Only when I got home did I notice the missing key."
      },
      {
        "form": "Cấm đoán dứt khoát",
        "structure": "Under no circumstances + trợ động từ + S + V",
        "example": "Under no circumstances should you leave the door open."
      },
      {
        "form": "Đảo ngữ trong câu điều kiện",
        "structure": "Were / Had / Should + S + …, S + would + V",
        "example": "Had I known about the traffic, I would have left earlier."
      },
      {
        "form": "So / Such… that",
        "structure": "So + adj + trợ động từ + S + that… · Such + be + N + that…",
        "example": "So loud was the music that we could not talk."
      }
    ],
    "uses": [
      {
        "name": "Nhấn rằng việc này rất hiếm",
        "sample": "{Rarely do} I eat out during the week.",
        "note": "Câu gốc chỉ có động từ thường nên phải mượn do làm trợ động từ, còn eat trở về nguyên thể."
      },
      {
        "name": "Kể hai việc xảy ra sát nhau",
        "sample": "No sooner {had} we left the house {than} it started to rain.",
        "note": "Vế trước dùng quá khứ hoàn thành và đảo had lên trước chủ ngữ; no sooner luôn đi với than, không đi với when."
      },
      {
        "name": "Thêm một ý nữa cho trang trọng",
        "sample": "Not only {did she win} the race, but she also broke the record.",
        "note": "Chỉ vế đầu bị đảo. Vế sau but giữ trật tự bình thường và có also đứng sau chủ ngữ."
      },
      {
        "name": "Nhấn rằng chuyện xảy ra rất muộn",
        "sample": "Not until the next morning {did we hear} the news.",
        "note": "Cụm thời gian đi cùng not until nằm nguyên ở đầu, phần bị đảo là mệnh đề chính phía sau."
      },
      {
        "name": "Cấm đoán, ra quy định",
        "sample": "Under no circumstances {should you share} your password.",
        "note": "Cụm giới từ mang nghĩa phủ định cũng kéo theo đảo ngữ như never hay rarely."
      },
      {
        "name": "Điều kiện trang trọng, bỏ if",
        "sample": "{Should} you need any help, just call this number.",
        "note": "Should thay cho if trong lời mời lịch sự, và sau chủ ngữ là động từ nguyên thể."
      },
      {
        "name": "Nhấn mức độ dẫn tới hậu quả",
        "sample": "So tired {was he} that he fell asleep on the sofa.",
        "note": "Tính từ được đưa lên đầu cùng so, còn động từ to be nhảy lên trước chủ ngữ."
      },
      {
        "name": "Mở đầu bằng nơi chốn cho sinh động",
        "sample": "In the corner {stood} an old piano covered in dust.",
        "note": "Dạng này đảo cả động từ chính chứ không mượn trợ động từ, và chỉ dùng khi chủ ngữ là danh từ, không phải đại từ."
      },
      {
        "name": "Khẳng định lại điều người nghe đang nghi ngờ",
        "sample": "I {do} remember meeting her at the conference.",
        "note": "do, does, did đặt trước động từ nguyên thể để nhấn rằng việc đó có thật, câu vẫn giữ trật tự thường."
      }
    ],
    "traps": [
      {
        "wrong": "Never I have seen such a big crowd.",
        "right": "Never have I seen such a big crowd.",
        "why": "Tiếng Việt chỉ cần đưa “chưa bao giờ” lên đầu là đủ nhấn, còn tiếng Anh bắt buộc kéo have lên trước chủ ngữ."
      },
      {
        "wrong": "Rarely I go to the cinema these days.",
        "right": "Rarely do I go to the cinema these days.",
        "why": "Câu không có sẵn trợ động từ thì phải mượn do, không được để nguyên động từ chính sau chủ ngữ."
      },
      {
        "wrong": "Not only he speaks English, but he also speaks French.",
        "right": "Not only does he speak English, but he also speaks French.",
        "why": "Vế đầu bị đảo nên mượn does, và động từ chính trả về nguyên thể; chỉ vế sau but mới giữ trật tự thường."
      },
      {
        "wrong": "No sooner we had arrived when the show started.",
        "right": "No sooner had we arrived than the show started.",
        "why": "Hai lỗi cùng lúc: quên đảo had lên trước chủ ngữ, và ghép nhầm no sooner với when thay vì than."
      },
      {
        "wrong": "Only when the lights went out we realised how serious the storm was.",
        "right": "Only when the lights went out did we realise how serious the storm was.",
        "why": "Mệnh đề đi sau only when giữ trật tự thường, phần phải đảo là mệnh đề chính đứng sau nó."
      },
      {
        "wrong": "Under no circumstances you should open this door.",
        "right": "Under no circumstances should you open this door.",
        "why": "Cụm giới từ mang nghĩa phủ định cũng kéo theo đảo ngữ, dù trong câu không có từ not nào."
      },
      {
        "wrong": "So beautiful the sunset was that everyone stopped to look.",
        "right": "So beautiful was the sunset that everyone stopped to look.",
        "why": "Khi so cùng tính từ lên đầu thì động từ to be phải vượt lên trước chủ ngữ."
      }
    ],
    "compare": {
      "with": "Câu trần thuật thường",
      "rows": [
        {
          "key": "Trật tự chủ ngữ và động từ",
          "other": "Chủ ngữ luôn đứng trước động từ",
          "self": "Trợ động từ nhảy lên trước chủ ngữ"
        },
        {
          "key": "Vị trí của trạng từ phủ định",
          "other": "Nằm giữa câu: I have never seen that film.",
          "self": "Nằm đầu câu: Never have I seen that film."
        },
        {
          "key": "Khi câu không có sẵn trợ động từ",
          "other": "Giữ nguyên động từ chính: I rarely eat out.",
          "self": "Mượn do, does hoặc did: Rarely do I eat out."
        },
        {
          "key": "Sắc thái",
          "other": "Trung tính, dùng được ở mọi tình huống",
          "self": "Trang trọng, hợp với văn viết và lời phát biểu"
        },
        {
          "key": "Ví dụ đối chiếu",
          "other": "He did not realise the truth until much later.",
          "self": "Not until much later did he realise the truth."
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Nghĩ rằng đưa từ phủ định lên đầu là đã nhấn mạnh xong",
          "self": "Quên bước đảo trợ động từ, hoặc không biết phải mượn do khi câu không có trợ động từ"
        }
      ]
    },
    "items": [
      {
        "id": "inversion-1",
        "kind": "cloze",
        "prompt": "Never ___ such a beautiful sunset. ",
        "answers": [
          "have I seen"
        ],
        "cue": "I have seen",
        "explain": "Trạng từ phủ định mở đầu câu kéo trợ động từ have vượt lên trước chủ ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-2",
        "kind": "cloze",
        "prompt": "Never ___ such good coffee in my life.",
        "answers": [
          "have I tasted"
        ],
        "explain": "Đưa never lên đầu rồi giữ nguyên trật tự là chưa xong việc, còn một bước đảo nữa.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-3",
        "kind": "cloze",
        "prompt": "Rarely ___ out during the week. ",
        "answers": [
          "do I eat"
        ],
        "cue": "I eat",
        "explain": "Câu chỉ có động từ thường nên phải mượn do, và eat quay về nguyên thể.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-4",
        "kind": "mcq",
        "prompt": "Little ___ that the trip would change everything.",
        "answers": [
          "did we know"
        ],
        "options": [
          "did we know",
          "we knew",
          "did we knew",
          "we did know"
        ],
        "explain": "Little ở đầu câu mang nghĩa phủ định nên trợ động từ did đứng trước chủ ngữ, còn know giữ nguyên thể.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-5",
        "kind": "cloze",
        "prompt": "Rarely ___ to the cinema these days.",
        "answers": [
          "does she go"
        ],
        "explain": "Ngôi thứ ba số ít mượn does, và đuôi -s chuyển hết sang trợ động từ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-6",
        "kind": "cloze",
        "prompt": "Seldom ___ about the noise. ",
        "answers": [
          "does he complain"
        ],
        "cue": "he complains",
        "explain": "Trợ động từ gánh phần chia ngôi, nên động từ chính trở lại dạng gốc.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-7",
        "kind": "cloze",
        "prompt": "Not only ___ the race, but she also broke the record. ",
        "answers": [
          "did she win"
        ],
        "cue": "she won",
        "explain": "Vế đầu ở thì quá khứ nên mượn did, còn vế sau but vẫn giữ trật tự bình thường.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-8",
        "kind": "mcq",
        "prompt": "Not only ___ a doctor, but she also teaches at the university.",
        "answers": [
          "is she"
        ],
        "options": [
          "is she",
          "she is",
          "does she",
          "she does"
        ],
        "explain": "Động từ to be tự nó đảo lên trước chủ ngữ, không cần mượn thêm trợ động từ nào.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-9",
        "kind": "cloze",
        "prompt": "Not only ___ English, but he also speaks Japanese.",
        "answers": [
          "does he speak"
        ],
        "explain": "Chỉ vế trước dấu phẩy mới đảo, và động từ chính phải bỏ đuôi -s khi đã có does.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-10",
        "kind": "cloze",
        "prompt": "No sooner ___ down than the phone rang. ",
        "answers": [
          "had we sat"
        ],
        "cue": "we had sat",
        "explain": "Việc xảy ra trước nằm ở quá khứ hoàn thành, và had vượt lên trước chủ ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-11",
        "kind": "mcq",
        "prompt": "Hardly ___ my eyes when the alarm rang.",
        "answers": [
          "had I closed"
        ],
        "options": [
          "had I closed",
          "I had closed",
          "had I close",
          "I closed"
        ],
        "explain": "Hardly cũng là trạng từ phủ định, nên had đứng trước chủ ngữ và động từ giữ dạng V3.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-12",
        "kind": "correct",
        "prompt": "No sooner had the film started when the power went out.",
        "answers": [
          "than"
        ],
        "tokens": [
          "No",
          "sooner",
          "had",
          "the",
          "film",
          "started",
          "when",
          "the",
          "power",
          "went",
          "out."
        ],
        "errIndex": 6,
        "explain": "no sooner luôn ghép với than; chỉ hardly và scarcely mới đi cùng when.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-13",
        "kind": "cloze",
        "prompt": "Not until midnight ___. ",
        "answers": [
          "did the last guest leave"
        ],
        "cue": "the last guest left",
        "explain": "Cụm thời gian sau not until nằm yên ở đầu, phần bị đảo là mệnh đề chính phía sau.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-14",
        "kind": "mcq",
        "prompt": "Only after the meeting ___ how tired I was.",
        "answers": [
          "did I realise"
        ],
        "options": [
          "did I realise",
          "I realised",
          "did I realised",
          "I did realise"
        ],
        "explain": "Only cùng cụm trạng ngữ mở đầu thì mệnh đề chính phải đảo, và động từ chính giữ nguyên thể.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-15",
        "kind": "cloze",
        "prompt": "Only when the lights went out ___ how serious the storm was.",
        "answers": [
          "did we realise"
        ],
        "explain": "Mệnh đề đi liền sau only when giữ trật tự thường, mệnh đề chính mới là chỗ phải đảo.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-16",
        "kind": "cloze",
        "prompt": "Under no circumstances ___ the door unlocked. ",
        "answers": [
          "should you leave"
        ],
        "cue": "you should leave",
        "explain": "Cụm giới từ mang nghĩa phủ định kéo theo đảo ngữ dù trong câu không có từ not.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-17",
        "kind": "mcq",
        "prompt": "Under no circumstances ___ the emergency door.",
        "answers": [
          "should passengers open"
        ],
        "options": [
          "should passengers open",
          "passengers should open",
          "should passengers opened",
          "passengers open"
        ],
        "explain": "Sau should luôn là động từ nguyên thể, và should phải đứng trước chủ ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-18",
        "kind": "cloze",
        "prompt": "Under no circumstances ___ give your password to anyone.",
        "answers": [
          "should you"
        ],
        "explain": "Trật tự đúng là trợ động từ trước, chủ ngữ sau, giống hệt cách đặt câu hỏi.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-19",
        "kind": "cloze",
        "prompt": "___ I known about the traffic, I would have left much earlier. ",
        "answers": [
          "Had"
        ],
        "cue": "if I had known",
        "explain": "Đảo ngữ của câu điều kiện loại 3: bỏ if và đưa had lên trước chủ ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-20",
        "kind": "mcq",
        "prompt": "___ I in your position, I would take the offer.",
        "answers": [
          "Were"
        ],
        "options": [
          "Were",
          "Was",
          "If",
          "Had"
        ],
        "explain": "Đảo ngữ của If I were, nên Were đứng đầu một mình và không kèm if.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-21",
        "kind": "mcq",
        "prompt": "___ you have any questions, please contact our office.",
        "answers": [
          "Should"
        ],
        "options": [
          "Should",
          "Would",
          "Will",
          "Shall"
        ],
        "explain": "Should thay cho if trong lời mời trang trọng, mang nghĩa nếu chẳng may có.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-22",
        "kind": "cloze",
        "prompt": "Should you ___ any help, please call this number.",
        "answers": [
          "need"
        ],
        "explain": "Should đã gánh vai trợ động từ nên phía sau chủ ngữ chỉ còn động từ nguyên thể.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-23",
        "kind": "mcq",
        "prompt": "Such ___ that he walked out of the room.",
        "answers": [
          "was his anger"
        ],
        "options": [
          "was his anger",
          "his anger was",
          "was he angry",
          "he was angry"
        ],
        "explain": "Such đi với danh từ, nên phần đảo lên là động từ to be rồi mới tới cụm danh từ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-24",
        "kind": "cloze",
        "prompt": "So beautiful ___ that everyone stopped to take photos.",
        "answers": [
          "was the sunset"
        ],
        "explain": "So đi với tính từ; khi cụm đó lên đầu thì to be phải vượt lên trước chủ ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-25",
        "kind": "cloze",
        "prompt": "In the corner ___ an old piano covered in dust. ",
        "answers": [
          "stood"
        ],
        "cue": "stand",
        "explain": "Trạng ngữ nơi chốn mở đầu thì động từ chính tự đảo lên, không mượn trợ động từ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-26",
        "kind": "mcq",
        "prompt": "___ the bus we have been waiting for.",
        "answers": [
          "Here comes"
        ],
        "options": [
          "Here comes",
          "Here come",
          "Comes here",
          "Here is coming"
        ],
        "explain": "Khuôn cố định với here và there, động từ chia theo danh từ đứng sau nó.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-27",
        "kind": "cloze",
        "prompt": "I ___ meeting her at the conference last year. ",
        "answers": [
          "do remember"
        ],
        "cue": "remember",
        "explain": "do đặt trước động từ nguyên thể để khẳng định lại điều người nghe đang nghi ngờ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-28",
        "kind": "transform",
        "prompt": "I have never seen such a long queue at the airport.",
        "answers": [
          "Never have I seen such a long queue at the airport."
        ],
        "explain": "Đưa never lên đầu rồi kéo trợ động từ have ra trước chủ ngữ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-29",
        "kind": "transform",
        "prompt": "She rarely takes a day off.",
        "answers": [
          "Rarely does she take a day off."
        ],
        "explain": "Câu gốc không có trợ động từ nên phải mượn does, và động từ chính bỏ đuôi -s.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-30",
        "kind": "transform",
        "prompt": "He did not realise his mistake until the next morning.",
        "answers": [
          "Not until the next morning did he realise his mistake."
        ],
        "explain": "Cụm not until cùng mốc thời gian lên đầu, mệnh đề chính đảo và bỏ phủ định.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-31",
        "kind": "transform",
        "prompt": "If I had left earlier, I would not have missed the flight.",
        "answers": [
          "Had I left earlier, I would not have missed the flight."
        ],
        "explain": "Bỏ if và đưa had lên trước chủ ngữ, phần còn lại của câu giữ nguyên.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "inversion-32",
        "kind": "transform",
        "prompt": "The film was so boring that we left after twenty minutes.",
        "answers": [
          "So boring was the film that we left after twenty minutes."
        ],
        "explain": "Cụm so cùng tính từ chuyển lên đầu, kéo động từ to be ra trước chủ ngữ.",
        "errorTag": "Trật tự từ"
      }
    ]
  },
  {
    "key": "cleft-sentences",
    "builtin": true,
    "name": "Cấu trúc chẻ (It is… that / What… is)",
    "nameEn": "Cleft sentences",
    "level": "C1",
    "group": "Trật tự từ & nhấn mạnh",
    "description": "Tách một câu làm hai phần để dồn sự chú ý vào đúng thành phần mình muốn nhấn: It is… that… hoặc What… is… Tiếng Việt chỉ cần thêm “chính là”, “chỉ có” là đủ nhấn mà không cần khung nào, nên người học hay viết thiếu that hoặc chia sai động từ trong khung.",
    "icon": "target",
    "tags": [
      "Trật tự từ"
    ],
    "signals": [
      "it is",
      "it was",
      "that",
      "who",
      "what",
      "all",
      "the reason why",
      "the person who",
      "the thing that",
      "not until"
    ],
    "formulas": [
      {
        "form": "Nhấn mạnh chủ ngữ",
        "structure": "It is / was + chủ ngữ + who / that + V",
        "example": "It was my sister who paid for the tickets."
      },
      {
        "form": "Nhấn mạnh tân ngữ",
        "structure": "It is / was + tân ngữ + that + S + V",
        "example": "It was the blue folder that I asked for."
      },
      {
        "form": "Nhấn mạnh trạng ngữ",
        "structure": "It is / was + trạng ngữ + that + S + V",
        "example": "It was in 2019 that we moved to Da Nang."
      },
      {
        "form": "Nhấn mạnh hành động",
        "structure": "What + S + V + is / was + V nguyên thể",
        "example": "What she did was call the police immediately."
      },
      {
        "form": "Nhấn mạnh sự vật hoặc mong muốn",
        "structure": "What + S + V + is / was + cụm danh từ",
        "example": "What I need is a strong cup of coffee."
      },
      {
        "form": "Giới hạn — chỉ có mỗi",
        "structure": "All (that) + S + V + is / was + …",
        "example": "All I want is a quiet weekend at home."
      },
      {
        "form": "Phủ định — mãi đến khi",
        "structure": "It was not until + mốc thời gian + that + S + V",
        "example": "It was not until Monday that we heard the news."
      }
    ],
    "uses": [
      {
        "name": "Chỉ rõ ai mới là người làm",
        "sample": "{It was my sister who} paid for the tickets, not me.",
        "note": "Phần được nhấn nằm ngay sau it was, còn phần còn lại của câu chuyển thành mệnh đề bắt đầu bằng who."
      },
      {
        "name": "Đính chính một hiểu lầm về vật",
        "sample": "{It was the blue folder that} I asked for, not the red one.",
        "note": "Tân ngữ được kéo lên khung nhấn mạnh, nhưng mệnh đề sau that vẫn giữ đủ chủ ngữ và động từ."
      },
      {
        "name": "Nhấn vào thời gian hoặc nơi chốn",
        "sample": "{It was in 2019 that} we moved to Da Nang.",
        "note": "Trạng ngữ cũng vào được khung này, và từ nối vẫn là that chứ không phải when hay where."
      },
      {
        "name": "Khung phải khớp thì của câu gốc",
        "sample": "{It is} the noise from the street that {keeps} me awake every night.",
        "note": "Câu gốc nói về thói quen hiện tại nên khung dùng it is, và động từ sau that vẫn chia theo danh từ được nhấn."
      },
      {
        "name": "Chỉ dùng who cho người",
        "sample": "{It was the letter that} arrived this morning, not the parcel.",
        "note": "that dùng được cho mọi thành phần, còn who chỉ dành cho người. Chọn nhầm who cho vật là lỗi thấy ngay."
      },
      {
        "name": "Nhấn vào việc đã làm",
        "sample": "{What she did was call} the police straight away.",
        "note": "Sau was là động từ nguyên thể, không chia lại theo quá khứ vì did trong vế đầu đã đánh dấu thì rồi."
      },
      {
        "name": "Nhấn vào thứ mình cần",
        "sample": "{What I need is} a few days off work.",
        "note": "Cả cụm What I need được coi là một chủ ngữ số ít nên động từ là is, dù phía sau là danh từ số nhiều."
      },
      {
        "name": "Nói rằng chỉ có mỗi điều đó",
        "sample": "{All I want is} a quiet weekend at home.",
        "note": "All ở đây mang nghĩa the only thing. Từ nối là that và thường được lược, tuyệt đối không dùng what."
      },
      {
        "name": "Mãi đến lúc đó mới xảy ra",
        "sample": "{It was not until} the next morning {that} we heard the news.",
        "note": "Khung này bắt buộc có that; thiếu nó câu vỡ thành hai mệnh đề rời không nối được với nhau."
      }
    ],
    "traps": [
      {
        "wrong": "It was my sister paid for the tickets.",
        "right": "It was my sister who paid for the tickets.",
        "why": "Tiếng Việt nói “chính chị tôi trả tiền vé” là đủ, không cần từ nối, nên người học bỏ luôn who hoặc that."
      },
      {
        "wrong": "It is my sister who paid for the tickets yesterday.",
        "right": "It was my sister who paid for the tickets yesterday.",
        "why": "Thì trong khung phải khớp với thì của câu gốc. Việc đã xảy ra hôm qua nên dùng it was."
      },
      {
        "wrong": "It was in Ha Noi where I met her for the first time.",
        "right": "It was in Ha Noi that I met her for the first time.",
        "why": "Trong cấu trúc chẻ, mọi thành phần đều nối bằng that, kể cả trạng ngữ nơi chốn hay thời gian."
      },
      {
        "wrong": "It was the letter who arrived this morning.",
        "right": "It was the letter that arrived this morning.",
        "why": "who chỉ dùng cho người. Với vật thì bắt buộc là that."
      },
      {
        "wrong": "What he did was called the police.",
        "right": "What he did was call the police.",
        "why": "Vế What he did đã đánh dấu quá khứ rồi, nên sau was chỉ còn động từ nguyên thể."
      },
      {
        "wrong": "All what I want is a quiet weekend.",
        "right": "All I want is a quiet weekend.",
        "why": "Sau All không bao giờ dùng what. Nếu muốn có từ nối thì dùng that, và thường người ta lược luôn."
      },
      {
        "wrong": "It was not until the next morning we heard the news.",
        "right": "It was not until the next morning that we heard the news.",
        "why": "Tiếng Việt nói “mãi đến sáng hôm sau chúng tôi mới nghe tin” không cần từ nối, nên that hay bị bỏ quên."
      }
    ],
    "compare": {
      "with": "Câu thường không nhấn mạnh",
      "rows": [
        {
          "key": "Cách làm nổi một thành phần",
          "other": "Nhấn giọng khi nói, hoặc thêm từ như “chính là”, “chỉ có”",
          "self": "Tách câu làm hai, đưa phần cần nhấn vào khung it… that"
        },
        {
          "key": "Số mệnh đề",
          "other": "Một mệnh đề duy nhất",
          "self": "Hai phần: khung nhấn mạnh và mệnh đề đi sau that hoặc who"
        },
        {
          "key": "Ví dụ đối chiếu",
          "other": "My sister paid for the tickets.",
          "self": "It was my sister who paid for the tickets."
        },
        {
          "key": "Động từ trong khung",
          "other": "Không có khung, chỉ chia mỗi động từ chính",
          "self": "it is cho hiện tại, it was cho quá khứ, khớp với thì của câu gốc"
        },
        {
          "key": "Từ nối",
          "other": "Không cần từ nối nào",
          "self": "that dùng cho mọi thành phần, who chỉ dùng cho người"
        },
        {
          "key": "Người Việt hay vấp ở đâu",
          "other": "Thêm “chính là” rồi giữ nguyên trật tự câu là xong",
          "self": "Viết thiếu that, hoặc chia sai động từ trong khung it is và it was"
        }
      ]
    },
    "items": [
      {
        "id": "cleft-sentences-1",
        "kind": "cloze",
        "prompt": "It ___ my sister who paid for the tickets, not me. ",
        "answers": [
          "was"
        ],
        "cue": "be",
        "explain": "Việc trả tiền đã xong nên khung nhấn mạnh phải ở quá khứ, khớp với thì của câu gốc.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-2",
        "kind": "mcq",
        "prompt": "___ my brother who fixed the laptop, not a technician.",
        "answers": [
          "It was"
        ],
        "options": [
          "It was",
          "It is",
          "There was",
          "He was"
        ],
        "explain": "Khung chẻ luôn mở đầu bằng chủ ngữ giả it, và câu gốc ở quá khứ nên động từ là was.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-3",
        "kind": "correct",
        "prompt": "It was my sister paid for the tickets.",
        "answers": [
          "who paid"
        ],
        "tokens": [
          "It",
          "was",
          "my",
          "sister",
          "paid",
          "for",
          "the",
          "tickets."
        ],
        "errIndex": 4,
        "explain": "Phần còn lại phải thành một mệnh đề, nên cần từ nối đứng trước động từ.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-4",
        "kind": "mcq",
        "prompt": "It was my parents ___ paid for the whole trip.",
        "answers": [
          "who"
        ],
        "options": [
          "who",
          "which",
          "what",
          "whom"
        ],
        "explain": "Phần được nhấn là người và đang giữ vai chủ ngữ của hành động phía sau.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-5",
        "kind": "cloze",
        "prompt": "It ___ the noise from the street that keeps me awake every night. ",
        "answers": [
          "is"
        ],
        "cue": "be",
        "explain": "Câu gốc nói về chuyện lặp lại hằng đêm nên khung ở hiện tại.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-6",
        "kind": "correct",
        "prompt": "It is the manager who called you yesterday.",
        "answers": [
          "was"
        ],
        "tokens": [
          "It",
          "is",
          "the",
          "manager",
          "who",
          "called",
          "you",
          "yesterday."
        ],
        "errIndex": 1,
        "explain": "yesterday khoá câu vào quá khứ, nên khung không thể đứng ở hiện tại.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-7",
        "kind": "cloze",
        "prompt": "It was John who ___ the window, not his brother. ",
        "answers": [
          "broke"
        ],
        "cue": "break",
        "explain": "Động từ sau who vẫn chia theo thì quá khứ của câu gốc, không bị khung làm cho đứng yên.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-8",
        "kind": "mcq",
        "prompt": "It is her patience ___ her a good teacher.",
        "answers": [
          "that makes"
        ],
        "options": [
          "that makes",
          "that make",
          "who makes",
          "what makes"
        ],
        "explain": "Danh từ được nhấn là patience, số ít và không phải người, nên từ nối là that và động từ thêm -s.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-9",
        "kind": "cloze",
        "prompt": "It was the blue folder ___ I asked for, not the red one.",
        "answers": [
          "that"
        ],
        "explain": "Phần được nhấn là vật và đang giữ vai tân ngữ, nên từ nối duy nhất dùng được là that.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-10",
        "kind": "mcq",
        "prompt": "It was the old bridge ___ attracted most of the tourists.",
        "answers": [
          "that"
        ],
        "options": [
          "that",
          "who",
          "what",
          "whose"
        ],
        "explain": "who chỉ dành cho người, còn một cây cầu thì phải nối bằng that.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-11",
        "kind": "correct",
        "prompt": "It was the letter who arrived this morning, not the parcel.",
        "answers": [
          "that"
        ],
        "tokens": [
          "It",
          "was",
          "the",
          "letter",
          "who",
          "arrived",
          "this",
          "morning,",
          "not",
          "the",
          "parcel."
        ],
        "errIndex": 4,
        "explain": "Chỉ người mới được nối bằng who; vật thì luôn dùng that.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-12",
        "kind": "cloze",
        "prompt": "It was in 2019 ___ we moved to Da Nang.",
        "answers": [
          "that"
        ],
        "explain": "Trạng ngữ thời gian nằm trong khung chẻ vẫn nối bằng that, không đổi thành when.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-13",
        "kind": "mcq",
        "prompt": "It was at the station ___ I lost my phone.",
        "answers": [
          "that"
        ],
        "options": [
          "that",
          "where",
          "when",
          "which"
        ],
        "explain": "Cấu trúc chẻ chỉ dùng một từ nối cho trạng ngữ, dù đó là nơi chốn hay thời gian.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-14",
        "kind": "correct",
        "prompt": "It was in Ha Noi where I met her for the first time.",
        "answers": [
          "that"
        ],
        "tokens": [
          "It",
          "was",
          "in",
          "Ha",
          "Noi",
          "where",
          "I",
          "met",
          "her",
          "for",
          "the",
          "first",
          "time."
        ],
        "errIndex": 5,
        "explain": "Đây không phải mệnh đề quan hệ chỉ nơi chốn, mà là khung nhấn mạnh nên từ nối cố định.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-15",
        "kind": "correct",
        "prompt": "It was the noise outside that keep me awake all night.",
        "answers": [
          "kept"
        ],
        "tokens": [
          "It",
          "was",
          "the",
          "noise",
          "outside",
          "that",
          "keep",
          "me",
          "awake",
          "all",
          "night."
        ],
        "errIndex": 6,
        "explain": "Động từ sau that chia theo danh từ được nhấn và theo thì quá khứ của câu gốc.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-16",
        "kind": "mcq",
        "prompt": "___ I really need is a few days off work.",
        "answers": [
          "What"
        ],
        "options": [
          "What",
          "That",
          "Which",
          "It"
        ],
        "explain": "Mở đầu bằng từ này thì cả cụm phía trước is trở thành chủ ngữ của câu.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-17",
        "kind": "cloze",
        "prompt": "What she ___ was call the police immediately. ",
        "answers": [
          "did"
        ],
        "cue": "do",
        "explain": "Vế đầu gánh dấu hiệu quá khứ cho cả câu, nên phần sau was mới được để nguyên thể.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-18",
        "kind": "mcq",
        "prompt": "What he did ___ the police straight away.",
        "answers": [
          "was call"
        ],
        "options": [
          "was call",
          "was called",
          "did call",
          "was calling"
        ],
        "explain": "Thì đã nằm ở did phía trước, nên sau was chỉ còn động từ ở dạng gốc.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-19",
        "kind": "correct",
        "prompt": "What we did was booked a later flight.",
        "answers": [
          "book"
        ],
        "tokens": [
          "What",
          "we",
          "did",
          "was",
          "booked",
          "a",
          "later",
          "flight."
        ],
        "errIndex": 4,
        "explain": "Chia thêm một lần quá khứ nữa là thừa, vì vế What we did đã đánh dấu rồi.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-20",
        "kind": "cloze",
        "prompt": "What surprised me ___ the price of the tickets, not the food. ",
        "answers": [
          "was"
        ],
        "cue": "be",
        "explain": "Cả cụm What surprised me được coi là một chủ ngữ số ít nên động từ chia số ít.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-21",
        "kind": "mcq",
        "prompt": "___ I want is a quiet weekend at home.",
        "answers": [
          "All"
        ],
        "options": [
          "All",
          "All what",
          "What all",
          "All which"
        ],
        "explain": "Từ này đã mang sẵn nghĩa the only thing nên không ghép thêm what phía sau.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-22",
        "kind": "cloze",
        "prompt": "All she ___ was that she needed more time. ",
        "answers": [
          "said"
        ],
        "cue": "say",
        "explain": "Mệnh đề phía trước was vẫn chia bình thường theo thì của câu gốc.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-23",
        "kind": "correct",
        "prompt": "All what we need is a bit more time.",
        "answers": [
          "that"
        ],
        "tokens": [
          "All",
          "what",
          "we",
          "need",
          "is",
          "a",
          "bit",
          "more",
          "time."
        ],
        "errIndex": 1,
        "explain": "Sau All chỉ dùng that, và trong lời nói thường người ta lược luôn từ nối này.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-24",
        "kind": "cloze",
        "prompt": "The thing ___ annoys me most is the noise from the street.",
        "answers": [
          "that"
        ],
        "explain": "Danh từ chung đứng đầu cần một từ nối để kéo theo mệnh đề mô tả nó.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-25",
        "kind": "mcq",
        "prompt": "The reason ___ he left the party early was a family emergency.",
        "answers": [
          "why"
        ],
        "options": [
          "why",
          "because",
          "because of",
          "what"
        ],
        "explain": "Tiếng Việt nói “lý do vì…” nên người học hay ghép nhầm, còn tiếng Anh chỉ nhận một từ nối cho lý do.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-26",
        "kind": "cloze",
        "prompt": "It was not until Monday ___ we finally heard the news.",
        "answers": [
          "that"
        ],
        "explain": "Khung not until bắt buộc có từ nối, thiếu nó câu vỡ thành hai mệnh đề rời.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-27",
        "kind": "cloze",
        "prompt": "It was not until the next morning ___ the news.",
        "answers": [
          "that we heard"
        ],
        "explain": "Tiếng Việt dùng “mãi đến… mới…” là đủ, còn tiếng Anh vẫn phải giữ đủ khung.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-28",
        "kind": "transform",
        "prompt": "My sister paid for the tickets.",
        "answers": [
          "It was my sister who paid for the tickets."
        ],
        "explain": "Chủ ngữ được kéo vào khung nhấn mạnh, phần còn lại nối bằng who vì đó là người.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-29",
        "kind": "transform",
        "prompt": "We moved to Da Nang in 2019.",
        "answers": [
          "It was in 2019 that we moved to Da Nang."
        ],
        "explain": "Trạng ngữ thời gian chuyển lên khung, và từ nối vẫn là that chứ không phải when.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-30",
        "kind": "transform",
        "prompt": "She called the police immediately.",
        "answers": [
          "What she did was call the police immediately."
        ],
        "explain": "Muốn nhấn vào hành động thì gói nó vào khung What… was, và động từ trở về nguyên thể.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-31",
        "kind": "transform",
        "prompt": "I only need one more day to finish the report.",
        "answers": [
          "All I need is one more day to finish the report."
        ],
        "explain": "only chuyển thành khung All… is để nói rằng chỉ có mỗi thứ đó.",
        "errorTag": "Trật tự từ"
      },
      {
        "id": "cleft-sentences-32",
        "kind": "transform",
        "prompt": "We did not hear the news until Monday.",
        "answers": [
          "It was not until Monday that we heard the news."
        ],
        "explain": "Phủ định dồn hết vào khung not until, nên mệnh đề sau that trở thành khẳng định.",
        "errorTag": "Trật tự từ"
      }
    ]
  }
]
