utils = {}

utils.butlast = (li) ->
  return [] unless li isnt []
  return [] unless li.length > 1
  return li[0...(li.length - 1)]

utils.bread_crumb = (li) ->
  return [] unless li isnt []
  return [li].concat utils.bread_crumb(utils.butlast(li))


module.exports = utils