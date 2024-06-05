import * as core from '@actions/core'
import { OmitOption, SortOption, getInputs } from '../src/inputs'

jest.mock('@actions/core')

const mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>
const mockGetBooleanInput = core.getBooleanInput as jest.MockedFunction<
  typeof core.getBooleanInput
>

const mockInput = (name: string, value: string) => {
  mockGetInput.mockImplementation((n: string) => (n === name ? value : ''))
}

describe('renderer', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('uses default values', () => {
    mockGetInput.mockReturnValue('')
    const inputs = getInputs()

    expect(inputs).toEqual({
      moduleDirectory: '.',
      testArguments: ['./...'],
      fromJSONFile: null,
      omit: new Set(),
      sorting: new Set(),
    })
  })

  it('parses moduleDirectory', () => {
    mockInput('moduleDirectory', 'foo')
    const inputs = getInputs()

    expect(inputs.moduleDirectory).toEqual('foo')
  })

  it('parses testArguments', () => {
    mockInput('testArguments', 'foo     bar')
    const inputs = getInputs()

    expect(inputs.testArguments).toEqual(['foo', 'bar'])
  })

  it('parses fromJSONFile', () => {
    mockInput('fromJSONFile', 'foo.json')
    const inputs = getInputs()

    expect(inputs.fromJSONFile).toEqual('foo.json')
  })

  it('parses omit', () => {
    mockInput(
      'omit',
      [...Object.values(OmitOption), 'foo', 'bar', 'baz'].join('\n')
    )
    const inputs = getInputs()

    expect(inputs.omit).toEqual(new Set(Object.values(OmitOption)))
  })

  it('parses sort', () => {
    mockInput(
      'sort',
      [...Object.values(SortOption), 'foo', 'bar', 'baz'].join('\n')
    )
    const inputs = getInputs()

    expect(inputs.sorting).toEqual(new Set(Object.values(SortOption)))
  })

  it('supports deprecated inputs', () => {
    mockGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'omitUntestedPackages':
        case 'omitSuccessfulPackages':
        case 'omitPie':
          return 'true'
        default:
          return ''
      }
    })

    mockGetBooleanInput.mockReturnValue(true)

    const inputs = getInputs()
    expect(inputs.omit).toEqual(
      new Set([OmitOption.Untested, OmitOption.Successful, OmitOption.Pie])
    )
    expect(core.warning).toHaveBeenCalled()
  })

  it('does not make an annotation if the deprecated inputs are not used', () => {
    mockGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'omitUntestedPackages':
        case 'omitSuccessfulPackages':
        case 'omitPie':
          return 'false'
        default:
          return ''
      }
    })
    mockGetBooleanInput.mockReturnValue(false)

    getInputs()
    expect(core.warning).not.toHaveBeenCalled()
  })
})
