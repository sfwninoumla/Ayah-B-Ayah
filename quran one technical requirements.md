## introduction

this application will work as a web browser extension(currently chrome).
the idea is to have a small extension popup with a single Aya(quran sentence) of quran and next-prev buttons to navigate between Ayas(quran sentences), so the user can read small parts when he have available time.

**Resources:**
- I will use this repo as a reference for quran verses: [repo](https://github.com/semarketir/quranjson) and I will use this dir from the repo for the verses [surah](https://github.com/semarketir/quranjson/tree/master/source/surah) each file in contains a full surah(quran topic with several verses)
## Knowledge

Below are neutral, developer-oriented definitions suitable for technical documentation.
### Surah

A **Surah** is a chapter of the Qur'an, the holy scripture of Islam.

**Key characteristics:**
- The Qur'an contains **114 Surahs**.
- Every Surah has:
	- A unique chapter number (1–114).
    - An Arabic name.
    - One or more Ayahs (verses).
- Surahs vary in length, ranging from **3 to 286 Ayahs**.
- The order of Surahs in the Qur'an is fixed and is not based on the chronological order of revelation.
- Each Surah is traditionally classified as either **Meccan** or **Medinan**, based on when it was revealed.

**Developer definition:**

> A Surah is the primary chapter entity in the Qur'an. It contains an ordered collection of Ayahs and metadata such as chapter number, name, revelation type, and verse count.

---
### Juz

A **Juz** (plural: **Ajzāʼ**) is one of **30 equal sections** into which the Qur'an is divided to facilitate reading and recitation, especially over the course of a month.

**Key characteristics:**

- The Qur'an contains **30 Juzs**.    
- A Juz is a reading division, **not** a thematic or structural chapter.
- A Juz may:
    - Begin or end in the middle of a Surah.
    - Contain parts of multiple Surahs.
- The boundaries of a Juz are standardized across all copies of the Qur'an.

**Developer definition:**

> A Juz is a standardized reading section of the Qur'an. It groups consecutive Ayahs for recitation purposes and may span portions of one or more Surahs.

---

### Ayah (Verse)

An **Ayah** (plural: **Ayat**) is an individual verse of the Qur'an and is the smallest textual unit commonly referenced.

**Key characteristics:**

- Every Ayah belongs to exactly one Surah.    
- Ayahs are sequentially numbered within their Surah, starting at 1.
- The total number of Ayahs varies depending on the counting tradition, but the standard numbering used in most digital Qur'an editions contains **6,236 Ayahs**.
- Ayahs vary in length from a few words to several sentences.

**Developer definition:**

> An Ayah is the smallest addressable unit of Qur'anic text. Each Ayah has a verse number within its Surah and may belong to one or more higher-level reading divisions (such as a Juz). It is the primary unit used for display, recitation, bookmarking, translation, and citation.

> **Note:** Although "verse" is a useful English translation, many Islamic applications use the transliterated Arabic term **Ayah** in their data models (e.g., `ayahNumber`, `ayahText`) to align with common Qur'anic APIs and datasets.


I wanna build an application that served as a chrome extension this extension would display Quran verses so and it will include a navigation UI that would work as a next and previews verse from Quran this UI also will include a drop-down menu to select any verse and it will have a search menu by number and name of Quran surah and verse so if the user need to select adverse from specific surah he will have to first select surah then select the verse by its text or by its number.

The user can open the extension as a drop-down extension or pop up that covers a small part of the page as any bob up extension the user can:
- select the surah he want to read and then select the verse he want to start read.
- start reading verse by verse and navigate the previews and the next verse using next and brave buttons.

there is specific and important features that must be included into this extension so it does it's duty perfectly:
- each time out well up optimized functionality using a perfect and performance no heavy algorithm or pattern to save the specific verse that user stopped on so if the user stopped on the verse number 120 or whatever number that will be saved in it's local storage or cookies whatever it would be better and avoid policy and privacy usage or bad usage so if the cookies are legal here without any consent banner that would be better or you can use the local storage and that would be good also.
- this extension would only handle the text only because this rebel have the audio and  some other dares and folders so in this application we will handle only the Surahs, Juzs, and Verses.
- this application must use better the performance none heavy executions and implementation be because it will have a huge data or text data from so it must be a specifically super light extension so the user cannot or not having any issue.

 the user interface must be clear and easy and comfort to the eyes using cold colors and also white colors you can also use white cold colors specifically the green white cold color would be better for this identity so the UI must contain:
 this UI will be in orderd as follow
 1. This  extension strictly will be right to left only so no you are that would be left right only right to left and will be in arabic strictly.
 2. at the top will be the name of the surah beside it on the left will be the surah versus numbers and the current verse number and also will contain the Juz number.
 3. The surah versus that have the same number.
 4. At the bottom would be the navigation menu the next and the prev buttons also we will have at the middle of this navigation menu is the select functionality by the drop-down so the user first select the surah then he can select the extra verse number by the second drop-down menu.
	 1. Surah drop-down menu will contain a search input so the user can search for the surah name or the number of the surah by its number the list of the surahs will contain each surah by its number and name `<number. surah-name>` and the user can select it easily.
	 2. The verse select the drop-down menu will contain a list of the verses by their numbers `number. verse-text` so the user can select universe easily also there is an condition that the user can search the verse by its number or by its text if the versus are over 20 verses so we can optimize the performance and the heavy loading.
	 3. The buttons to the navigation would be the previews to the right and the next to the left.