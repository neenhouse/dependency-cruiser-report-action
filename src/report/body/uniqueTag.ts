import { createHash } from 'node:crypto'
import type { VisualizeType } from '~/src/options/validateOptions'

interface Context {
  owner: string
  repo: string
  issueNumber: number
  workingDirectory: string
  visualizeType: VisualizeType
}

const hashedContext = (context: Context) => {
  const hash = createHash('sha256')
  const json = {
    owner: context.owner,
    repo: context.repo,
    issueNumber: context.issueNumber,
    workingDirectory: context.workingDirectory,
    visualizeType: context.visualizeType,
  }
  hash.update(JSON.stringify(json))
  return hash.digest('hex')
}

export const uniqueTag = (context: Context) => {
  const hashedId = hashedContext(context)
  return `<!-- This comment was generated by dependency-cruiser-report-action. id: ${hashedId} -->`
}
