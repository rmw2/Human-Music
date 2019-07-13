import React, { Component } from 'react'

const debounce = (func, delay) => {
  let inDebounce
  return function() {
    const context = this
    const args = arguments
    clearTimeout(inDebounce)
    inDebounce = setTimeout(() => func.apply(context, args), delay)
  }
}

/**
 * @classdesc
 * An svg which adapts to the parent size
 */
export default class ResponsiveSVG extends Component {
  state = {
    width: 0,
    height: 0,
  }

  constructor(props) {
    super(props)
    this.updateSize = this.updateSize.bind(this)
  }

  componentDidMount() {
    this.updateSize()
    document.addEventListener('resize', debounce(this.updateSize, 500))
  }

  componentWillUnmount() {
    document.removeEventListener('resize', this.updateSize)
  }

  updateSize() {
    if (this.svg) {
      const {width, height} = this.svg.parentNode.getBoundingClientRect()

      this.setState({width, height})
      // HOOK BACK TO PASS SIZE TO PARENT.  MAYBE THIS SHOULD BE LIFTED UP SOMEHOW
      this.props.onUpdate(width, height)
    }
  }

  render() {
    const {children} = this.props
    const { width, height } = this.state

    /**
     * Render a dummy div if width is not specified, calculate width & height
     * and re-render with SVG.  This allows SVG to mount at the proper side,
     * enabling entrance animations at scale.
     */
    return width ? (
      <svg ref={svg => this.svg = svg} width={width} height={height}>
        {children}
      </svg>
    ) : (
      <div id="svg-dummy" ref={div => this.svg = div}></div>
    )
  }
}