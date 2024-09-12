type Mode = 'resident' | 'trigger'

type TriggerPosition = `${'left' | 'right'}-${'top' | 'bottom'}`

interface Book {
  name: string
  path: string
  lastChapter: number
  lastParagraph: number
  chapterTitleRegExp: string
}
