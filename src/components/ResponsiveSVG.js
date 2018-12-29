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
  svg = React.createRef()

  state = {
    width: null,
    height: null,
  }

  componentDidMount() {
    this.updateSize()
    document.addEventListener('resize', debounce(this.updateSize, 500))
  }

  componentWillUnmount() {
    document.removeEventListener('resize', this.updateSize)
  }

  updateSize() {
    const {width, height} = this.svg.parentNode.getBoundingClientRect()
    this.setState({width, height})
  }

  render() {
    const {children} = this.props
    const {width, height} = this.state

    return width ? (
      <svg ref={this.svg} width={width} height={height}>
        {children}
      </svg>
    ) : null
  }
}