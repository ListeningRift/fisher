type Mode = 'resident' | 'trigger'

type TriggerPosition = `${'left' | 'right'}-${'top' | 'bottom'}`

interface PageMark {
  paragraphIndex: number
  characterIndex: number
}

interface Book {
  name: string
  path: string
  lastChapter: number
  lastPage: PageMark
  chapterTitleRegExp: string
}
