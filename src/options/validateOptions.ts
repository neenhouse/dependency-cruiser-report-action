import type { InferType } from 'yup'
import { number, object, string, ValidationError } from 'yup'

import { ActionError } from '../ActionError'

const SUPPORTED_PACKAGE_MANAGERS = ['yarn', 'npm', 'pnpm', 'bun'] as const

const MESSAGE_REQUIRED_ISSUE_NUMBER = 'pull_request event payload is not found.'
const MESSAGE_REQUIRED_TARGET_FILES = 'No target files were found'
const MESSAGE_INVALID_PACKAGE_MANAGER = `inputs.package_manager must be one of: ${SUPPORTED_PACKAGE_MANAGERS.join(
  ', ',
)}`
const WARNING_MESSAGES = [MESSAGE_REQUIRED_TARGET_FILES]

const packageManagerSchema = string()
  .required()
  .oneOf(SUPPORTED_PACKAGE_MANAGERS, MESSAGE_INVALID_PACKAGE_MANAGER)

const detectedCruiseScript = (_packageManager: string): string => {
  const packageManager = packageManagerSchema.validateSync(_packageManager)
  switch (packageManager) {
    case 'yarn':
      return 'yarn run -s depcruise'
    case 'npm':
      return 'npx --no-install depcruise'
    case 'pnpm':
      return 'pnpm exec depcruise'
    case 'bun':
      return 'bun x depcruise'
  }
}

const optionsSchema = object({
  token: string().required(),
  owner: string().required(),
  repo: string().required(),
  issueNumber: number().required(MESSAGE_REQUIRED_ISSUE_NUMBER),
  sha: string().required(),
  targetFiles: string().required(MESSAGE_REQUIRED_TARGET_FILES),
  focus: string().required(),
  depcruiseConfigFilePath: string().required(),
  workingDirectory: string().required(),
  packageManager: packageManagerSchema,
  cruiseScript: string()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    .transform((value) => (value === '' ? undefined : value))
    .when('packageManager', ([packageManager], schema) => {
      return typeof packageManager === 'string'
        ? schema.default(detectedCruiseScript(packageManager))
        : schema
    })
    .required(),
})

export type Options = InferType<typeof optionsSchema>

export const validateOptions = async (params: unknown): Promise<Options> => {
  const options = await optionsSchema.validate(params, { abortEarly: false }).catch((e) => {
    if (e instanceof ValidationError && e.errors.every((e) => WARNING_MESSAGES.includes(e))) {
      throw new ActionError(e.errors.join(', '), 'warning')
    }

    throw e
  })

  return options
}
